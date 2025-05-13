import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { sql, type Kysely } from "kysely";
import { LixSchemaMap, type LixInternalDatabaseSchema } from "./schema.js";
import { executeSync } from "./execute-sync.js";

export function handleUpdateOnView(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>,
	viewName: string,
	...data: Array<any>
): any {
	const rowData: Record<string, any> = {};
	for (let i = 0; i < data.length; i += 2) {
		rowData[data[i]] = data[i + 1];
	}

	const schema = LixSchemaMap[viewName]!;
	const pk = schema["x-lix-primary-key"]!.map((key) => rowData[key]).join("::");

	// Insert new snapshot
	const [snapshot] = executeSync({
		lix: { sqlite },
		query: db
			.insertInto("internal_snapshot")
			.values({
				content: sql`jsonb(${JSON.stringify(rowData)})`,
			})
			.returning("id"),
	});

	// Insert new change row
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

	return JSON.stringify(rowData);
}
