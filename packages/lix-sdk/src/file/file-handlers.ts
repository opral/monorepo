import { executeSync } from "../database/execute-sync.js";
import type { LixFile } from "./schema.js";
import { createLixOwnLogSync } from "../log/create-lix-own-log.js";
import type { Lix } from "../lix/open-lix.js";
import { lixUnknownFileFallbackPlugin } from "./unknown-file-fallback-plugin.js";
import { storeDetectedChangeSchema } from "./store-detected-change-schema.js";

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
	lix: Pick<Lix, "sqlite" | "plugin" | "db">;
	file: LixFile;
}): 0 | 1 {
	// Insert the file metadata into state table
	executeSync({
		lix: args.lix,
		query: args.lix.db.insertInto("state").values({
			entity_id: args.file.id,
			schema_key: "lix_file",
			file_id: args.file.id,
			plugin_key: "lix_own_entity",
			snapshot_content: {
				id: args.file.id,
				path: args.file.path,
				metadata: args.file.metadata || null,
			},
			version_id: args.file.version_id,
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
		});

		if (detectedChanges.length > 0) {
			hasChanges = true;
			// Validate and store schemas for all detected changes
			for (const change of detectedChanges) {
				storeDetectedChangeSchema({
					lix: args.lix,
					schema: change.schema,
				});
			}
			
			// Store plugin detected changes in state table
			for (const change of detectedChanges) {
				executeSync({
					lix: args.lix,
					query: args.lix.db.insertInto("state").values({
						entity_id: change.entity_id,
						schema_key: change.schema["x-lix-key"],
						file_id: args.file.id,
						plugin_key: plugin.key,
						snapshot_content: change.snapshot_content as any,
						version_id: args.file.version_id,
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
						query: args.lix.db.insertInto("state").values({
							entity_id: change.entity_id,
							schema_key: change.schema["x-lix-key"],
							file_id: args.file.id,
							plugin_key: lixUnknownFileFallbackPlugin.key,
							snapshot_content: change.snapshot_content as any,
							version_id: args.file.version_id,
						}),
					});
				}
			}
		}
	} else if (!hasChanges) {
		createLixOwnLogSync({
			lix: args.lix,
			key: "lix_file_no_changes_detected",
			level: "debug",
			message: `File inserted at ${args.file.path} but plugin detected no changes`,
		});
	}

	return 0;
}

export function handleFileUpdate(args: {
	lix: Pick<Lix, "sqlite" | "plugin" | "db">;
	file: LixFile;
}): 0 | 1 {
	// Update the file metadata in state table
	executeSync({
		lix: args.lix,
		query: args.lix.db
			.updateTable("state")
			.set({
				snapshot_content: {
					id: args.file.id,
					path: args.file.path,
					metadata: args.file.metadata || null,
				},
			})
			.where("entity_id", "=", args.file.id)
			.where("schema_key", "=", "lix_file")
			.where("version_id", "=", args.file.version_id),
	});

	// Get current file data for comparison
	const currentFile = executeSync({
		lix: args.lix,
		query: args.lix.db
			.selectFrom("file")
			.where("id", "=", args.file.id)
			.where("version_id", "=", args.file.version_id)
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
			});

			if (detectedChanges.length > 0) {
				hasChanges = true;
				// Validate and store schemas for all detected changes
				for (const change of detectedChanges) {
					storeDetectedChangeSchema({
						lix: args.lix,
						schema: change.schema,
					});
				}
				
				// Update plugin detected changes in state table
				for (const change of detectedChanges) {
					// Check if the plugin change already exists
					const existingChange = executeSync({
						lix: args.lix,
						query: args.lix.db
							.selectFrom("state")
							.where("entity_id", "=", change.entity_id)
							.where("schema_key", "=", change.schema["x-lix-key"])
							.where("file_id", "=", args.file.id)
							.where("version_id", "=", args.file.version_id)
							.where("plugin_key", "=", plugin.key)
							.select("entity_id"),
					});

					if (existingChange.length > 0) {
						// Update existing change
						executeSync({
							lix: args.lix,
							query: args.lix.db
								.updateTable("state")
								.set({
									snapshot_content: change.snapshot_content as any,
								})
								.where("entity_id", "=", change.entity_id)
								.where("schema_key", "=", change.schema["x-lix-key"])
								.where("file_id", "=", args.file.id)
								.where("version_id", "=", args.file.version_id)
								.where("plugin_key", "=", plugin.key),
						});
					} else {
						// Insert new change
						executeSync({
							lix: args.lix,
							query: args.lix.db.insertInto("state").values({
								entity_id: change.entity_id,
								schema_key: change.schema["x-lix-key"],
								file_id: args.file.id,
								plugin_key: plugin.key,
								snapshot_content: change.snapshot_content as any,
								version_id: args.file.version_id,
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
						// Check if the plugin change already exists
						const existingChange = executeSync({
							lix: args.lix,
							query: args.lix.db
								.selectFrom("state")
								.where("entity_id", "=", change.entity_id)
								.where("schema_key", "=", change.schema["x-lix-key"])
								.where("file_id", "=", args.file.id)
								.where("version_id", "=", args.file.version_id)
								.where("plugin_key", "=", lixUnknownFileFallbackPlugin.key)
								.select("entity_id"),
						});

						if (existingChange.length > 0) {
							// Update existing change
							executeSync({
								lix: args.lix,
								query: args.lix.db
									.updateTable("state")
									.set({
										snapshot_content: change.snapshot_content as any,
									})
									.where("entity_id", "=", change.entity_id)
									.where("schema_key", "=", change.schema["x-lix-key"])
									.where("file_id", "=", args.file.id)
									.where("version_id", "=", args.file.version_id)
									.where("plugin_key", "=", lixUnknownFileFallbackPlugin.key),
							});
						} else {
							// Insert new change
							executeSync({
								lix: args.lix,
								query: args.lix.db.insertInto("state").values({
									entity_id: change.entity_id,
									schema_key: change.schema["x-lix-key"],
									file_id: args.file.id,
									plugin_key: lixUnknownFileFallbackPlugin.key,
									snapshot_content: change.snapshot_content as any,
									version_id: args.file.version_id,
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

	return 0;
}
