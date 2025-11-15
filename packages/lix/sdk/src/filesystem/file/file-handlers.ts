import type { LixFile } from "./schema.js";
import { LixFileDescriptorSchema } from "./schema-definition.js";
import { createLixOwnLogSync } from "../../log/create-lix-own-log.js";
import { lixUnknownFileFallbackPlugin } from "./unknown-file-fallback-plugin.js";
import { storeDetectedChangeSchema } from "./store-detected-change-schema.js";
import { createQuerySync } from "../../plugin/query-sync.js";
import { clearFileDataCache } from "./cache/clear-file-data-cache.js";
import { updateFilePathCache } from "./cache/update-file-path-cache.js";
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

const normalizeMetadataValue = (value: unknown): unknown => {
	if (value === null || value === undefined) {
		return null;
	}

	if (Array.isArray(value)) {
		return value.map((item) => normalizeMetadataValue(item));
	}

	if (typeof value === "object") {
		return Object.keys(value as Record<string, unknown>)
			.sort()
			.reduce<Record<string, unknown>>((acc, key) => {
				acc[key] = normalizeMetadataValue(
					(value as Record<string, unknown>)[key]
				);
				return acc;
			}, {});
	}

	return value;
};

const metadataEquals = (left: unknown, right: unknown): boolean => {
	return (
		JSON.stringify(normalizeMetadataValue(left)) ===
		JSON.stringify(normalizeMetadataValue(right))
	);
};

export function handleFileInsert(args: {
	engine: Pick<
		LixEngine,
		"hooks" | "getAllPluginsSync" | "executeSync" | "sqlite"
	>;
	file: FileMutationInput;
	versionId: string;
	untracked?: boolean;
}): 0 | 1 {
	const { rows: skipRows } = args.engine.executeSync(
		internalQueryBuilder
			.selectFrom("key_value")
			.where("key", "=", "lix_skip_file_handlers")
			.select("value")
			.compile()
	);
	const shouldSkip = skipRows[0]?.value;

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
	args.engine.executeSync(
		internalQueryBuilder
			.insertInto("state_by_version")
			.values({
				entity_id: args.file.id,
				schema_key: LixFileDescriptorSchema["x-lix-key"],
				file_id: args.file.id,
				plugin_key: "lix_sdk",
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
			})
			.compile()
	);

	updateFilePathCache({
		engine: args.engine,
		fileId: args.file.id,
		versionId: args.versionId,
		directoryId: descriptorFields.directoryId,
		name: descriptorFields.name,
		extension: descriptorFields.extension ?? null,
		path: normalizedPath,
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
					engine: args.engine,
					schema: change.schema,
					untracked: args.untracked || false,
				});
			}

			// Store plugin detected changes in state table
			for (const change of detectedChanges) {
				args.engine.executeSync(
					internalQueryBuilder
						.insertInto("state_by_version")
						.values({
							entity_id: change.entity_id,
							schema_key: change.schema["x-lix-key"],
							file_id: args.file.id,
							plugin_key: plugin.key,
							snapshot_content: change.snapshot_content as any,
							schema_version: change.schema["x-lix-version"],
							version_id: args.versionId,
							untracked: args.untracked || false,
						})
						.compile()
				);
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
						engine: args.engine,
						schema: change.schema,
					});
				}

				for (const change of detectedChanges) {
					args.engine.executeSync(
						internalQueryBuilder
							.insertInto("state_by_version")
							.values({
								entity_id: change.entity_id,
								schema_key: change.schema["x-lix-key"],
								file_id: args.file.id,
								plugin_key: lixUnknownFileFallbackPlugin.key,
								snapshot_content: change.snapshot_content as any,
								schema_version: change.schema["x-lix-version"],
								version_id: args.versionId,
								untracked: args.untracked || false,
							})
							.compile()
					);
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

	return 0;
}

export function handleFileUpdate(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "getAllPluginsSync" | "executeSync"
	>;
	file: FileMutationInput;
	versionId: string;
	untracked?: boolean;
}): 0 | 1 {
	const { rows: skipRowsUpdate } = args.engine.executeSync(
		internalQueryBuilder
			.selectFrom("key_value")
			.where("key", "=", "lix_skip_file_handlers")
			.select("value")
			.compile()
	);
	const shouldSkip = skipRowsUpdate[0]?.value;

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

	// Only fetch descriptor-related columns to determine if descriptor needs updating
	const currentDescriptorRows = args.engine.executeSync(
		internalQueryBuilder
			.selectFrom("file_by_version")
			.where("id", "=", args.file.id)
			.where("lixcol_version_id", "=", args.versionId)
			.select(["directory_id", "name", "extension", "metadata", "hidden"])
			.compile()
	).rows as Pick<
		LixFile,
		"directory_id" | "name" | "extension" | "metadata" | "hidden"
	>[];
	const currentDescriptor = currentDescriptorRows[0];

	const descriptorChanged =
		!currentDescriptor ||
		currentDescriptor.directory_id !== pluginFile.directory_id ||
		currentDescriptor.name !== pluginFile.name ||
		currentDescriptor.extension !== pluginFile.extension ||
		Boolean(currentDescriptor.hidden) !== pluginFile.hidden ||
		!metadataEquals(
			currentDescriptor.metadata ?? null,
			pluginFile.metadata ?? null
		);

	if (descriptorChanged) {
		args.engine.executeSync(
			internalQueryBuilder
				.updateTable("state_by_version")
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
				.where("version_id", "=", args.versionId)
				.compile()
		);
	}

	updateFilePathCache({
		engine: args.engine,
		fileId: args.file.id,
		versionId: args.versionId,
		directoryId: descriptorFields.directoryId,
		name: descriptorFields.name,
		extension: descriptorFields.extension ?? null,
		path: normalizedPath,
	});

	// Fetch the full file row for plugin diffing and other mutation handling
	const currentFileRows = args.engine.executeSync(
		internalQueryBuilder
			.selectFrom("file_by_version")
			.where("id", "=", args.file.id)
			.where("lixcol_version_id", "=", args.versionId)
			.selectAll()
			.compile()
	).rows as LixFile[];
	const currentFile = currentFileRows[0];

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
						engine: args.engine,
						schema: change.schema,
						untracked: args.untracked || false,
					});
				}

				// Update plugin detected changes in state table
				for (const change of detectedChanges) {
					if (change.snapshot_content === null) {
						// Handle deletion: remove the entity from state table
						args.engine.executeSync(
							internalQueryBuilder
								.deleteFrom("state_by_version")
								.where("entity_id", "=", change.entity_id)
								.where("schema_key", "=", change.schema["x-lix-key"])
								.where("file_id", "=", args.file.id)
								.where("version_id", "=", args.versionId)
								.compile()
						);
					} else {
						// Handle update/insert: upsert the entity in state table
						args.engine.executeSync(
							internalQueryBuilder
								.insertInto("state_by_version")
								.values({
									entity_id: change.entity_id,
									schema_key: change.schema["x-lix-key"],
									file_id: args.file.id,
									plugin_key: plugin.key,
									snapshot_content: change.snapshot_content as any,
									schema_version: change.schema["x-lix-version"],
									version_id: args.versionId,
									untracked: args.untracked || false,
								})
								.compile()
						);
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
							engine: args.engine,
							schema: change.schema,
							untracked: args.untracked || false,
						});
					}

					for (const change of detectedChanges) {
						if (change.snapshot_content === null) {
							// Handle deletion: remove the entity from state table
							args.engine.executeSync(
								internalQueryBuilder
									.deleteFrom("state_by_version")
									.where("entity_id", "=", change.entity_id)
									.where("schema_key", "=", change.schema["x-lix-key"])
									.where("file_id", "=", args.file.id)
									.where("version_id", "=", args.versionId)
									.compile()
							);
						} else {
							// Handle update/insert: upsert the entity in state table
							args.engine.executeSync(
								internalQueryBuilder
									.insertInto("state_by_version")
									.values({
										entity_id: change.entity_id,
										schema_key: change.schema["x-lix-key"],
										file_id: args.file.id,
										plugin_key: lixUnknownFileFallbackPlugin.key,
										snapshot_content: change.snapshot_content as any,
										schema_version: change.schema["x-lix-version"],
										version_id: args.versionId,
										untracked: args.untracked || false,
									})
									.compile()
							);
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

	return 0;
}
