import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { sql, type Kysely } from "kysely";
import {
	LixSchemaMap,
	type LixDatabaseSchema,
	type LixInternalDatabaseSchema,
} from "./schema.js";
import { executeSync } from "./execute-sync.js";
import { validateSchema } from "../schema/validate-schema.js";
import { buildRowDataFromSchema } from "./handle-update-on-view.js";

export function handleInsertOnView(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>,
	viewName: string,
	...data: Array<any>
): any {
	const schema = LixSchemaMap[viewName]!;
	const rowData = buildRowDataFromSchema(schema, data);

	// double colon is used as a separator for compound primary keys
	// which is not appearing in the nano_id alphabet. thus, should be safe
	// for the entity_id
	const pk = schema["x-lix-primary-key"]!.map((key) => rowData[key]).join("::");

	validateSchema({
		lix: { sqlite, db: db as unknown as Kysely<LixDatabaseSchema> },
		schema,
		data: rowData,
	});

	const [snapshot] = executeSync({
		lix: { sqlite },
		query: db
			.insertInto("internal_snapshot")
			.values({
				content: sql`jsonb(${JSON.stringify(rowData)})`,
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
	return JSON.stringify(rowData);
}
