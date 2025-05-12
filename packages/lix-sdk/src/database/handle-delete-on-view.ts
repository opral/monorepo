import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "./schema.js";
import { executeSync } from "./execute-sync.js";

export function handleDeleteOnView(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>,
	viewName: string,
	...data: Array<any>
): any {
	const rowData: Record<string, any> = {};
	for (let i = 0; i < data.length; i += 2) {
		rowData[data[i]] = data[i + 1];
	}
	if (!rowData.id) throw new Error("Missing id for delete");

	executeSync({
		lix: { sqlite },
		query: db
			.insertInto("internal_change")
			.values({
				entity_id: rowData.id,
				schema_key: "lix_" + viewName,
				snapshot_id: "no-content",
				file_id: "lix_own_change_control",
				plugin_key: "lix_own_change_control",
			})
			.returningAll(),
	});

	return rowData.id;
}
