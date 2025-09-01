import { executeSync } from "../database/execute-sync.js";
import { createQuery, executeQuerySync } from "../plugin/query.js";
import type { LixFile } from "./schema.js";
import { LixFileDescriptorSchema } from "./schema.js";
import { createLixOwnLogSync } from "../log/create-lix-own-log.js";
import type { Lix } from "../lix/open-lix.js";
import { lixUnknownFileFallbackPlugin } from "./unknown-file-fallback-plugin.js";
import { storeDetectedChangeSchema } from "./store-detected-change-schema.js";
import { clearFileDataCache } from "./cache/clear-file-data-cache.js";

function globSync(args: {
	lix: Pick<Lix, "sqlite">;
	glob: string;
	path: string;
}): boolean {
	const columnNames: string[] = [];
	const result = args.lix.sqlite.exec({
		sql: `SELECT CASE WHEN ? GLOB ? THEN 1 ELSE 0 END AS matches`,
		bind: [args.path, args.glob],
		returnValue: "resultRows",
		columnNames,
	});

	return (result[0]?.[0] as any) === 1;
}

export function handleFileInsert(args: {
	lix: Pick<Lix, "sqlite" | "plugin" | "db" | "hooks">;
	file: LixFile;
	versionId: string;
	untracked?: boolean;
}): 0 | 1 {
	const [shouldSkip] = executeSync({
		lix: args.lix,
		query: args.lix.db
			.selectFrom("key_value")
			.where("key", "=", "lix_skip_file_handlers")
			.select("value"),
	});

	if (shouldSkip) {
		// If skip flag is set, do not process the file
		createLixOwnLogSync({
			lix: args.lix,
			key: "lix_file_skipped_insert_handler",
			level: "debug",
			message: `Skipping file insert for ${args.file.path} due to lix_skip_file_handlers flag`,
		});
		return 1; // Indicate no changes were made
	}

	// Insert the file metadata into state table
	executeSync({
		lix: args.lix,
		query: args.lix.db.insertInto("state_all").values({
			entity_id: args.file.id,
			schema_key: LixFileDescriptorSchema["x-lix-key"],
			file_id: args.file.id,
			plugin_key: "lix_own_entity",
			snapshot_content: {
				id: args.file.id,
				path: args.file.path,
				metadata: args.file.metadata || null,
				hidden: args.file.hidden ?? false,
			},
			schema_version: LixFileDescriptorSchema["x-lix-version"],
			version_id: args.versionId,
			untracked: args.untracked || false,
		}),
	});

	const plugins = args.lix.plugin.getAllSync();
	let foundPlugin = false;
	let hasChanges = false;

	for (const plugin of plugins) {
		// Check if plugin glob matches file path
		if (
			!plugin.detectChangesGlob ||
			!globSync({
				lix: args.lix,
				path: args.file.path,
				glob: plugin.detectChangesGlob,
			})
		) {
			continue;
		}

		foundPlugin = true;

		if (plugin.detectChanges === undefined) {
			createLixOwnLogSync({
				lix: args.lix,
				key: "lix_file_no_plugin",
				level: "warn",
				message: `File inserted at ${args.file.path} but plugin does not support detecting changes`,
			});
			continue;
		}

		// Detect changes with the plugin
		const detectedChanges = plugin.detectChanges({
			after: args.file,
			query: createQuery({ lix: args.lix }),
			executeSync: (qb: any) => executeQuerySync({ lix: args.lix, query: qb }),
		});

		if (detectedChanges.length > 0) {
			hasChanges = true;
			// Validate and store schemas for all detected changes
			for (const change of detectedChanges) {
				storeDetectedChangeSchema({
					lix: args.lix,
					schema: change.schema,
					untracked: args.untracked || false,
				});
			}

			// Store plugin detected changes in state table
			for (const change of detectedChanges) {
				executeSync({
					lix: args.lix,
					query: args.lix.db.insertInto("state_all").values({
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
			lix: args.lix,
			key: "lix_file_no_plugin",
			level: "warn",
			message: `File inserted at ${args.file.path} but no plugin available to detect changes`,
		});

		// Use fallback plugin to handle the file
		if (lixUnknownFileFallbackPlugin.detectChanges) {
			const detectedChanges = lixUnknownFileFallbackPlugin.detectChanges({
				after: args.file,
			});

			if (detectedChanges.length > 0) {
				// Validate and store schemas for fallback plugin changes
				for (const change of detectedChanges) {
					storeDetectedChangeSchema({
						lix: args.lix,
						schema: change.schema,
					});
				}

				for (const change of detectedChanges) {
					executeSync({
						lix: args.lix,
						query: args.lix.db.insertInto("state_all").values({
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
				lix: args.lix,
				key: "lix_file_no_changes_detected",
				level: "debug",
				message: `File inserted at ${args.file.path} but plugin detected no changes`,
			});
		}
		// Do NOT invoke fallback plugin if a plugin was found, even if it returned no changes
	}

	// Don't cache data here - the data needs to be materialized by plugins first
	// Data caching happens in selectFileData after materialization

	// Don't cache lixcol metadata here either - the commit_id will change after auto-commit
	// The cache will be populated on first read via selectFileLixcol

	// Emit file change event
	args.lix.hooks._emit("file_change", {
		fileId: args.file.id,
		operation: "inserted",
	});

	return 0;
}

export function handleFileUpdate(args: {
	lix: Pick<Lix, "sqlite" | "plugin" | "db" | "hooks">;
	file: LixFile;
	versionId: string;
	untracked?: boolean;
}): 0 | 1 {
	const [shouldSkip] = executeSync({
		lix: args.lix,
		query: args.lix.db
			.selectFrom("key_value")
			.where("key", "=", "lix_skip_file_handlers")
			.select("value"),
	});

	if (shouldSkip) {
		// If skip flag is set, do not process the file
		createLixOwnLogSync({
			lix: args.lix,
			key: "lix_file_skipped_update_handler",
			level: "debug",
			message: `Skipping file update for ${args.file.path} due to lix_skip_file_handlers flag`,
		});
		return 1; // Indicate no changes were made
	}

	// Update the file metadata in state table FIRST
	executeSync({
		lix: args.lix,
		query: args.lix.db
			.updateTable("state_all")
			.set({
				snapshot_content: {
					id: args.file.id,
					path: args.file.path,
					metadata: args.file.metadata || null,
					hidden: args.file.hidden ?? false,
				},
				untracked: args.untracked || false,
			})
			.where("entity_id", "=", args.file.id)
			.where("schema_key", "=", "lix_file_descriptor")
			.where("version_id", "=", args.versionId),
	});

	// Get current file data for comparison
	const currentFile = executeSync({
		lix: args.lix,
		query: args.lix.db
			.selectFrom("file_all")
			.where("id", "=", args.file.id)
			.where("lixcol_version_id", "=", args.versionId)
			.selectAll(),
	})[0] as LixFile | undefined;

	if (currentFile) {
		const plugins = args.lix.plugin.getAllSync();
		let foundPlugin = false;
		let hasChanges = false;

		for (const plugin of plugins) {
			// Check if plugin glob matches file path
			if (
				!plugin.detectChangesGlob ||
				!globSync({
					lix: args.lix,
					path: args.file.path,
					glob: plugin.detectChangesGlob,
				})
			) {
				continue;
			}

			foundPlugin = true;

			if (plugin.detectChanges === undefined) {
				createLixOwnLogSync({
					lix: args.lix,
					key: "lix_file_no_plugin",
					level: "warn",
					message: `File updated at ${args.file.path} but plugin does not support detecting changes`,
				});
				continue;
			}

			// Detect changes between current and updated file
			const detectedChanges = plugin.detectChanges({
				before: currentFile,
				after: args.file,
				query: createQuery({ lix: args.lix }),
				executeSync: (qb: any) =>
					executeQuerySync({ lix: args.lix, query: qb }),
			});

			if (detectedChanges.length > 0) {
				hasChanges = true;
				// Validate and store schemas for all detected changes
				for (const change of detectedChanges) {
					storeDetectedChangeSchema({
						lix: args.lix,
						schema: change.schema,
						untracked: args.untracked || false,
					});
				}

				// Update plugin detected changes in state table
				for (const change of detectedChanges) {
					if (change.snapshot_content === null) {
						// Handle deletion: remove the entity from state table
						executeSync({
							lix: args.lix,
							query: args.lix.db
								.deleteFrom("state_all")
								.where("entity_id", "=", change.entity_id)
								.where("schema_key", "=", change.schema["x-lix-key"])
								.where("file_id", "=", args.file.id)
								.where("version_id", "=", args.versionId),
						});
					} else {
						// Handle update/insert: upsert the entity in state table
						executeSync({
							lix: args.lix,
							query: args.lix.db.insertInto("state_all").values({
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
				lix: args.lix,
				key: "lix_file_no_plugin",
				level: "warn",
				message: `File updated at ${args.file.path} but no plugin available to detect changes`,
			});

			// Use fallback plugin to handle the file
			if (lixUnknownFileFallbackPlugin.detectChanges) {
				const detectedChanges = lixUnknownFileFallbackPlugin.detectChanges({
					before: currentFile,
					after: args.file,
					query: createQuery({ lix: args.lix }),
					executeSync: (qb: any) =>
						executeQuerySync({ lix: args.lix, query: qb }),
				});

				if (detectedChanges.length > 0) {
					// Validate and store schemas for fallback plugin changes
					for (const change of detectedChanges) {
						storeDetectedChangeSchema({
							lix: args.lix,
							schema: change.schema,
							untracked: args.untracked || false,
						});
					}

					for (const change of detectedChanges) {
						if (change.snapshot_content === null) {
							// Handle deletion: remove the entity from state table
							executeSync({
								lix: args.lix,
								query: args.lix.db
									.deleteFrom("state_all")
									.where("entity_id", "=", change.entity_id)
									.where("schema_key", "=", change.schema["x-lix-key"])
									.where("file_id", "=", args.file.id)
									.where("version_id", "=", args.versionId),
							});
						} else {
							// Handle update/insert: upsert the entity in state table
							executeSync({
								lix: args.lix,
								query: args.lix.db.insertInto("state_all").values({
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
				lix: args.lix,
				key: "lix_file_no_changes_detected",
				level: "debug",
				message: `File updated at ${args.file.path} but plugin detected no changes`,
			});
		}
	}

	// Clear data cache AFTER all updates are complete
	clearFileDataCache({
		lix: args.lix,
		fileId: args.file.id,
		versionId: args.versionId,
	});

	// Emit file change event
	args.lix.hooks._emit("file_change", {
		fileId: args.file.id,
		operation: "updated",
	});

	return 0;
}
