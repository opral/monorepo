import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Kysely } from "kysely";
import { executeSync } from "../database/execute-sync.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { mockJsonPlugin } from "../plugin/mock-json-plugin.js";
import type { LixFile } from "./schema.js";

export function materializeFileData(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<LixInternalDatabaseSchema>;
	file: Omit<LixFile, "data">;
}): Uint8Array {
	// Get plugin changes from state table
	const changes = executeSync({
		lix: { sqlite: args.sqlite },
		query: args.db
			.selectFrom("state")
			.where("plugin_key", "=", mockJsonPlugin.key)
			.where("file_id", "=", args.file.id)
			.where("version_id", "=", args.file.version_id)
			.select([
				"entity_id",
				"schema_key",
				"file_id",
				"plugin_key",
				"snapshot_content",
				"version_id",
			]),
	});

	// Format changes for plugin
	const formattedChanges = changes.map((change) => ({
		...change,
		snapshot:
			typeof change.snapshot_content === "string"
				? JSON.parse(change.snapshot_content)
				: change.snapshot_content,
	}));

	const file = mockJsonPlugin.applyChanges!({
		file: args.file,
		changes: formattedChanges,
	});

	return file.fileData;
}

export function handleFileInsert(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<LixInternalDatabaseSchema>;
	file: LixFile;
}): 0 | 1 {
	// Insert the file metadata into state table
	executeSync({
		lix: { sqlite: args.sqlite },
		query: args.db.insertInto("state").values({
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

	// Detect and store plugin changes
	const detectedChanges = mockJsonPlugin.detectChanges!({
		after: { data: args.file.data },
	});

	// Store plugin detected changes in state table
	for (const change of detectedChanges) {
		executeSync({
			lix: { sqlite: args.sqlite },
			query: args.db.insertInto("state").values({
				entity_id: change.entity_id,
				schema_key: change.schema["x-lix-key"],
				file_id: args.file.id,
				plugin_key: mockJsonPlugin.key,
				snapshot_content: change.snapshot_content as any,
				version_id: args.file.version_id,
			}),
		});
	}

	return 0;
}

export function handleFileUpdate(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<LixInternalDatabaseSchema>;
	file: LixFile;
}): 0 | 1 {
	// Update the file metadata in state table
	executeSync({
		lix: { sqlite: args.sqlite },
		query: args.db
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
		lix: { sqlite: args.sqlite },
		query: args.db
			.selectFrom("file")
			.where("id", "=", args.file.id)
			.where("version_id", "=", args.file.version_id)
			.selectAll(),
	})[0] as LixFile | undefined;

	if (currentFile) {
		// Detect changes between current and updated file
		const detectedChanges = mockJsonPlugin.detectChanges?.({
			before: { data: currentFile.data },
			after: { data: args.file.data },
		});

		// Update plugin detected changes in state table
		for (const change of detectedChanges ?? []) {
			// Check if the plugin change already exists
			const existingChange = executeSync({
				lix: { sqlite: args.sqlite },
				query: args.db
					.selectFrom("state")
					.where("entity_id", "=", change.entity_id)
					.where("schema_key", "=", change.schema["x-lix-key"])
					.where("file_id", "=", args.file.id)
					.where("version_id", "=", args.file.version_id)
					.where("plugin_key", "=", mockJsonPlugin.key)
					.select("entity_id"),
			});

			if (existingChange.length > 0) {
				// Update existing change
				executeSync({
					lix: { sqlite: args.sqlite },
					query: args.db
						.updateTable("state")
						.set({
							snapshot_content: change.snapshot_content as any,
						})
						.where("entity_id", "=", change.entity_id)
						.where("schema_key", "=", change.schema["x-lix-key"])
						.where("file_id", "=", args.file.id)
						.where("version_id", "=", args.file.version_id)
						.where("plugin_key", "=", mockJsonPlugin.key),
				});
			} else {
				// Insert new change
				executeSync({
					lix: { sqlite: args.sqlite },
					query: args.db.insertInto("state").values({
						entity_id: change.entity_id,
						schema_key: change.schema["x-lix-key"],
						file_id: args.file.id,
						plugin_key: mockJsonPlugin.key,
						snapshot_content: change.snapshot_content as any,
						version_id: args.file.version_id,
					}),
				});
			}
		}
	}

	return 0;
}
