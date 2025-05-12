import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { sql, type Kysely } from "kysely";
import { LixSchemaMap, type LixInternalDatabaseSchema } from "./schema.js";
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

	const schema = LixSchemaMap[viewName]!;
	const pk = schema["x-primary-key"]!.map((key) => newRowData[key]).join(",");

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
				entity_id: pk,
				schema_key: "lix_" + viewName,
				snapshot_id: snapshot.id,
				file_id: "lix_own_change_control",
				plugin_key: "lix_own_change_control",
			})
			.returningAll(),
	});
	return JSON.stringify(newRowData);
}
