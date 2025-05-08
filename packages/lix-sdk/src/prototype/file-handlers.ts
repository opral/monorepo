import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { mockJsonPluginV2 } from "./json-plugin.js";
import type { LixFile } from "./file-schema.js";
import type { InternalDatabaseSchema } from "./database-schema.js";
import type { Kysely } from "kysely";
import { executeSync } from "../database/execute-sync.js";

export function handleFileInsert(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<InternalDatabaseSchema>;
	file: LixFile;
}): 0 | 1 {
	const detectedChanges = mockJsonPluginV2.detectChanges({
		after: { data: args.file.data },
	});

	const [snapshot] = executeSync({
		lix: { sqlite: args.sqlite },
		query: args.db
			.insertInto("snapshot")
			.values({
				content: JSON.stringify({
					id: args.file.id,
					path: args.file.path,
					version_id: args.file.version_id,
				}) as any,
			})
			.returning("id"),
	});

	// file change itself
	executeSync({
		lix: { sqlite: args.sqlite },
		query: args.db.insertInto("change").values({
			entity_id: args.file.id,
			file_id: "lix_own_change_control",
			plugin_key: "lix_own_change_control",
			schema_key: "lix_file_table",
			snapshot_id: snapshot.id,
		}),
	});

	// plugin detected changes
	for (const change of detectedChanges) {
		const [snapshot] = executeSync({
			lix: { sqlite: args.sqlite },
			query: args.db
				.insertInto("snapshot")
				.values({
					id: Math.random().toString(36).slice(2),
					content: JSON.stringify(change.snapshot) as any,
				})
				.returning("id"),
		});

		executeSync({
			lix: { sqlite: args.sqlite },
			query: args.db.insertInto("change").values({
				entity_id: change.entity_id,
				file_id: args.file.id,
				plugin_key: mockJsonPluginV2.key,
				schema_key: change.schema.key,
				snapshot_id: snapshot.id,
			}),
		});
	}

	return 0;
}
