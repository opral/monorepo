import { executeSync } from "../../database/execute-sync.js";
import type { LixFile } from "./schema.js";
import { LixFileDescriptorSchema } from "./schema-definition.js";
import { createLixOwnLogSync } from "../../log/create-lix-own-log.js";
import { lixUnknownFileFallbackPlugin } from "./unknown-file-fallback-plugin.js";
import { storeDetectedChangeSchema } from "./store-detected-change-schema.js";
import { createQuerySync } from "../../plugin/query-sync.js";
import { clearFileDataCache } from "./cache/clear-file-data-cache.js";
import type { LixEngine } from "../../engine/boot.js";
import {
	ensureDirectoryAncestors,
	assertNoDirectoryAtFilePath,
} from "../directory/ensure-directories.js";
import { matchesGlob } from "../util/glob.js";
import { normalizeFilePath } from "../path.js";
import { deriveDescriptorFieldsFromPath } from "./descriptor-utils.js";
import { internalQueryBuilder } from "../../engine/internal-query-builder.js";

type FileMutationInput = {
	id: string;
	path: string;
	data: Uint8Array;
	metadata: unknown;
	hidden?: boolean;
};

export function handleFileInsert(args: {
	engine: Pick<LixEngine, "sqlite" | "hooks" | "getAllPluginsSync">;
	file: FileMutationInput;
	versionId: string;
	untracked?: boolean;
}): 0 | 1 {
	const [shouldSkip] = executeSync({
		engine: args.engine,
		query: internalQueryBuilder
			.selectFrom("key_value")
			.where("key", "=", "lix_skip_file_handlers")
			.select("value"),
	});

	if (shouldSkip) {
		// If skip flag is set, do not process the file
		createLixOwnLogSync({
			engine: args.engine,
			key: "lix_file_skipped_insert_handler",
			level: "debug",
			message: "Skipping file insert; file handlers disabled",
			payload: {
				path: args.file.path,
				reason: "lix_skip_file_handlers",
			},
		});
		return 1; // Indicate no changes were made
	}

	const normalizedPath = normalizeFilePath(args.file.path);

	ensureDirectoryAncestors({
		engine: args.engine,
		versionId: args.versionId,
		filePath: normalizedPath,
	});

	assertNoDirectoryAtFilePath({
		engine: args.engine,
		versionId: args.versionId,
		filePath: normalizedPath,
	});

	const descriptorFields = deriveDescriptorFieldsFromPath({
		engine: args.engine,
		versionId: args.versionId,
		path: normalizedPath,
		metadata: args.file.metadata,
		hidden: args.file.hidden ?? false,
	});

	const pluginFile: LixFile = {
		id: args.file.id,
		path: normalizedPath,
		directory_id: descriptorFields.directoryId,
		name: descriptorFields.name,
		extension: descriptorFields.extension ?? null,
		metadata: descriptorFields.metadata ?? null,
		hidden: descriptorFields.hidden,
		data: args.file.data,
	};

	// Insert the file metadata into state table
	executeSync({
		engine: args.engine,
		query: internalQueryBuilder.insertInto("state_all").values({
			entity_id: args.file.id,
			schema_key: LixFileDescriptorSchema["x-lix-key"],
			file_id: args.file.id,
			plugin_key: "lix_own_entity",
			snapshot_content: {
				id: args.file.id,
				directory_id: descriptorFields.directoryId,
				name: descriptorFields.name,
				extension: descriptorFields.extension ?? null,
				metadata: descriptorFields.metadata ?? null,
				hidden: descriptorFields.hidden,
			},
			schema_version: LixFileDescriptorSchema["x-lix-version"],
			version_id: args.versionId,
			metadata: descriptorFields.metadata ?? null,
			untracked: args.untracked || false,
		}),
	});

	const querySync = createQuerySync({ engine: args.engine });

	const plugins = args.engine.getAllPluginsSync();
	let foundPlugin = false;
	let hasChanges = false;

	for (const plugin of plugins) {
		// Check if plugin glob matches file path
		if (
			!plugin.detectChangesGlob ||
			!matchesGlob({
				engine: args.engine,
				path: normalizedPath,
				pattern: plugin.detectChangesGlob,
			})
		) {
			continue;
		}

		foundPlugin = true;

		if (plugin.detectChanges === undefined) {
			createLixOwnLogSync({
				engine: args.engine,
				key: "lix_file_no_plugin",
				level: "warn",
				message: "Plugin matched insert but cannot detect changes",
				payload: {
					operation: "insert",
					path: normalizedPath,
					pluginKey: plugin.key,
				},
			});
			continue;
		}

		// Detect changes with the plugin

		const detectedChanges = plugin.detectChanges({
			after: pluginFile,
			querySync,
		});

		if (detectedChanges.length > 0) {
			hasChanges = true;
			// Validate and store schemas for all detected changes
			for (const change of detectedChanges) {
				storeDetectedChangeSchema({
					engine: {
						sqlite: args.engine.sqlite as any,
						db: internalQueryBuilder as any,
					} as any,
					schema: change.schema,
					untracked: args.untracked || false,
				});
			}

			// Store plugin detected changes in state table
			for (const change of detectedChanges) {
				executeSync({
					engine: args.engine,
					query: internalQueryBuilder.insertInto("state_all").values({
						entity_id: change.entity_id,
						schema_key: change.schema["x-lix-key"],
						file_id: args.file.id,
						plugin_key: plugin.key,
						snapshot_content: change.snapshot_content as any,
						schema_version: change.schema["x-lix-version"],
						version_id: args.versionId,
						untracked: args.untracked || false,
					}),
				});
			}
		}
	}

	// Log appropriate messages based on what happened
	if (!foundPlugin) {
		createLixOwnLogSync({
			engine: args.engine,
			key: "lix_file_no_plugin",
			level: "warn",
			message: "No plugin matched file insert",
			payload: {
				operation: "insert",
				path: normalizedPath,
			},
		});

		// Use fallback plugin to handle the file
		if (lixUnknownFileFallbackPlugin.detectChanges) {
			const detectedChanges = lixUnknownFileFallbackPlugin.detectChanges({
				after: pluginFile,
				querySync,
			});

			if (detectedChanges.length > 0) {
				// Validate and store schemas for fallback plugin changes
				for (const change of detectedChanges) {
					storeDetectedChangeSchema({
						engine: {
							sqlite: args.engine.sqlite as any,
							db: internalQueryBuilder as any,
						} as any,
						schema: change.schema,
					});
				}

				for (const change of detectedChanges) {
					executeSync({
						engine: args.engine,
						query: internalQueryBuilder.insertInto("state_all").values({
							entity_id: change.entity_id,
							schema_key: change.schema["x-lix-key"],
							file_id: args.file.id,
							plugin_key: lixUnknownFileFallbackPlugin.key,
							snapshot_content: change.snapshot_content as any,
							schema_version: change.schema["x-lix-version"],
							version_id: args.versionId,
							untracked: args.untracked || false,
						}),
					});
				}
			}
		}
	} else {
		if (!hasChanges) {
			createLixOwnLogSync({
				engine: args.engine,
				key: "lix_file_no_changes_detected",
				level: "debug",
				message: "Plugin detected no changes during insert",
				payload: {
					operation: "insert",
					path: normalizedPath,
				},
			});
		}
		// Do NOT invoke fallback plugin if a plugin was found, even if it returned no changes
	}

	// Don't cache data here - the data needs to be materialized by plugins first
	// Data caching happens in selectFileData after materialization

	// Don't cache lixcol metadata here either - the commit_id will change after auto-commit
	// The cache will be populated on first read via selectFileLixcol

	// Emit file change event
	args.engine.hooks._emit("file_change", {
		fileId: args.file.id,
		operation: "inserted",
	});

	return 0;
}

export function handleFileUpdate(args: {
	engine: Pick<LixEngine, "sqlite" | "hooks" | "getAllPluginsSync">;
	file: FileMutationInput;
	versionId: string;
	untracked?: boolean;
}): 0 | 1 {
	const [shouldSkip] = executeSync({
		engine: args.engine,
		query: internalQueryBuilder
			.selectFrom("key_value")
			.where("key", "=", "lix_skip_file_handlers")
			.select("value"),
	});

	if (shouldSkip) {
		// If skip flag is set, do not process the file
		createLixOwnLogSync({
			engine: args.engine,
			key: "lix_file_skipped_update_handler",
			level: "debug",
			message: "Skipping file update; file handlers disabled",
			payload: {
				path: args.file.path,
				reason: "lix_skip_file_handlers",
			},
		});
		return 1; // Indicate no changes were made
	}

	const normalizedPath = normalizeFilePath(args.file.path);

	ensureDirectoryAncestors({
		engine: args.engine,
		versionId: args.versionId,
		filePath: normalizedPath,
	});

	assertNoDirectoryAtFilePath({
		engine: args.engine,
		versionId: args.versionId,
		filePath: normalizedPath,
	});

	const descriptorFields = deriveDescriptorFieldsFromPath({
		engine: args.engine,
		versionId: args.versionId,
		path: normalizedPath,
		metadata: args.file.metadata,
		hidden: args.file.hidden ?? false,
	});

	const pluginFile: LixFile = {
		id: args.file.id,
		path: normalizedPath,
		directory_id: descriptorFields.directoryId,
		name: descriptorFields.name,
		extension: descriptorFields.extension ?? null,
		metadata: descriptorFields.metadata ?? null,
		hidden: descriptorFields.hidden,
		data: args.file.data,
	};

	// Update the file metadata in state table FIRST
	executeSync({
		engine: args.engine,
		query: internalQueryBuilder
			.updateTable("state_all")
			.set({
				snapshot_content: {
					id: args.file.id,
					directory_id: descriptorFields.directoryId,
					name: descriptorFields.name,
					extension: descriptorFields.extension ?? null,
					metadata: descriptorFields.metadata ?? null,
					hidden: descriptorFields.hidden,
				},
				metadata: descriptorFields.metadata ?? null,
				untracked: args.untracked || false,
			})
			.where("entity_id", "=", args.file.id)
			.where("schema_key", "=", "lix_file_descriptor")
			.where("version_id", "=", args.versionId),
	});

	// Get current file data for comparison
	const currentFile = executeSync({
		engine: args.engine,
		query: internalQueryBuilder
			.selectFrom("file_all")
			.where("id", "=", args.file.id)
			.where("lixcol_version_id", "=", args.versionId)
			.selectAll(),
	})[0] as LixFile | undefined;

	if (currentFile) {
		// Create querySync once per handler invocation
		const querySync = createQuerySync({ engine: args.engine });
		const plugins = args.engine.getAllPluginsSync();
		let foundPlugin = false;
		let hasChanges = false;

		for (const plugin of plugins) {
			// Check if plugin glob matches file path
			if (
				!plugin.detectChangesGlob ||
				!matchesGlob({
					engine: args.engine,
					path: normalizedPath,
					pattern: plugin.detectChangesGlob,
				})
			) {
				continue;
			}

			foundPlugin = true;

			if (plugin.detectChanges === undefined) {
				createLixOwnLogSync({
					engine: args.engine,
					key: "lix_file_no_plugin",
					level: "warn",
					message: "Plugin matched update but cannot detect changes",
					payload: {
						operation: "update",
						path: normalizedPath,
						pluginKey: plugin.key,
					},
				});
				continue;
			}

			// Detect changes between current and updated file
			const detectedChanges = plugin.detectChanges({
				before: currentFile,
				after: pluginFile,
				querySync,
			});

			if (detectedChanges.length > 0) {
				hasChanges = true;
				// Validate and store schemas for all detected changes
				for (const change of detectedChanges) {
					storeDetectedChangeSchema({
						engine: {
							sqlite: args.engine.sqlite as any,
							db: internalQueryBuilder as any,
						} as any,
						schema: change.schema,
						untracked: args.untracked || false,
					});
				}

				// Update plugin detected changes in state table
				for (const change of detectedChanges) {
					if (change.snapshot_content === null) {
						// Handle deletion: remove the entity from state table
						executeSync({
							engine: args.engine,
							query: internalQueryBuilder
								.deleteFrom("state_all")
								.where("entity_id", "=", change.entity_id)
								.where("schema_key", "=", change.schema["x-lix-key"])
								.where("file_id", "=", args.file.id)
								.where("version_id", "=", args.versionId),
						});
					} else {
						// Handle update/insert: upsert the entity in state table
						executeSync({
							engine: args.engine,
							query: internalQueryBuilder.insertInto("state_all").values({
								entity_id: change.entity_id,
								schema_key: change.schema["x-lix-key"],
								file_id: args.file.id,
								plugin_key: plugin.key,
								snapshot_content: change.snapshot_content as any,
								schema_version: change.schema["x-lix-version"],
								version_id: args.versionId,
								untracked: args.untracked || false,
							}),
						});
					}
				}
			}
		}

		// Log appropriate messages based on what happened
		if (!foundPlugin) {
			createLixOwnLogSync({
				engine: args.engine,
				key: "lix_file_no_plugin",
				level: "warn",
				message: "No plugin matched file update",
				payload: {
					operation: "update",
					path: normalizedPath,
				},
			});

			// Use fallback plugin to handle the file
			if (lixUnknownFileFallbackPlugin.detectChanges) {
				const detectedChanges = lixUnknownFileFallbackPlugin.detectChanges({
					before: currentFile,
					after: pluginFile,
					querySync,
				});

				if (detectedChanges.length > 0) {
					// Validate and store schemas for fallback plugin changes
					for (const change of detectedChanges) {
						storeDetectedChangeSchema({
							engine: {
								sqlite: args.engine.sqlite as any,
								db: internalQueryBuilder as any,
							} as any,
							schema: change.schema,
							untracked: args.untracked || false,
						});
					}

					for (const change of detectedChanges) {
						if (change.snapshot_content === null) {
							// Handle deletion: remove the entity from state table
							executeSync({
								engine: args.engine,
								query: internalQueryBuilder
									.deleteFrom("state_all")
									.where("entity_id", "=", change.entity_id)
									.where("schema_key", "=", change.schema["x-lix-key"])
									.where("file_id", "=", args.file.id)
									.where("version_id", "=", args.versionId),
							});
						} else {
							// Handle update/insert: upsert the entity in state table
							executeSync({
								engine: args.engine,
								query: internalQueryBuilder.insertInto("state_all").values({
									entity_id: change.entity_id,
									schema_key: change.schema["x-lix-key"],
									file_id: args.file.id,
									plugin_key: lixUnknownFileFallbackPlugin.key,
									snapshot_content: change.snapshot_content as any,
									schema_version: change.schema["x-lix-version"],
									version_id: args.versionId,
									untracked: args.untracked || false,
								}),
							});
						}
					}
				}
			}
		} else if (!hasChanges) {
			createLixOwnLogSync({
				engine: args.engine,
				key: "lix_file_no_changes_detected",
				level: "debug",
				message: "Plugin detected no changes during update",
				payload: {
					operation: "update",
					path: normalizedPath,
				},
			});
		}
	}

	// Clear data cache AFTER all updates are complete
	clearFileDataCache({
		engine: args.engine,
		fileId: args.file.id,
		versionId: args.versionId,
	});

	// Emit file change event
	args.engine.hooks._emit("file_change", {
		fileId: args.file.id,
		operation: "updated",
	});

	return 0;
}
