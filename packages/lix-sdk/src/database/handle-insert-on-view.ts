import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "./schema.js";
import { executeSync } from "./execute-sync.js";

export function handleInsertOnView(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>,
	viewName: string,
	...data: Array<any>
): any {
	const newRowData: Record<string, any> = {};
	for (let i = 0; i < data.length; i += 2) {
		newRowData[data[i]] = data[i + 1];
	}

	const [snapshot] = executeSync({
		lix: { sqlite },
		query: db
			.insertInto("internal_snapshot")
			.values({
				content: sql`jsonb(${JSON.stringify(newRowData)})`,
			})
			.returning("id"),
	});

	executeSync({
		lix: { sqlite },
		query: db
			.insertInto("internal_change")
			.values({
				entity_id: newRowData.id,
				schema_key: "lix_" + viewName,
				snapshot_id: snapshot.id,
				file_id: "lix_own_change_control",
				plugin_key: "lix_own_change_control",
			})
			.returningAll(),
	});
	return JSON.stringify(newRowData);
}
