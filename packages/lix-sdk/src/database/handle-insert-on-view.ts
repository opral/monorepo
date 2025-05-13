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
	// using JSON.stringify to avoid coming up with a custom serialization
	// and parsing logic for compound primary keys. using something as simple
	// as join by comma can lead to issues downstream if the primary key
	// contains a comma etc.
	const pk =
		schema["x-lix-primary-key"]!.length > 1
			? JSON.stringify(
					schema["x-lix-primary-key"]!.map((key) => newRowData[key])
				)
			: newRowData[schema["x-lix-primary-key"]![0]!];

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
