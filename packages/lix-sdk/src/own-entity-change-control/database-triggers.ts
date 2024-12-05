import type { SqliteDatabase } from "sqlite-wasm-kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import { handleLixOwnEntityChange } from "./handle-lix-own-entity-change.js";
import type { Kysely } from "kysely";
import { changeControlledTables } from "./change-controlled-tables.js";

export function applyOwnEntityChangeControlTriggers(
	sqlite: SqliteDatabase,
	db: Kysely<LixDatabaseSchema>
): void {
	// TODO use pragma to get table info instead of hardcoded column names
	// https://github.com/opral/lix-sdk/issues/176
	//
	// const tableInfo = sqlite.exec("PRAGMA table_info(key_value);");
	// console.log(tableInfo);

	sqlite.createFunction({
		name: "handle_lix_own_entity_change",
		arity: -1,
		// @ts-expect-error - dynamic function
		xFunc: (
			_ctx: number,
			tableName: keyof LixDatabaseSchema,
			operation: "insert" | "update" | "delete",
			...value
		) => {
			handleLixOwnEntityChange(db, tableName, operation, ...value);
		},
	});

	for (const [table, columns] of Object.entries(changeControlledTables)) {
		const sql = `
      CREATE TEMP TRIGGER IF NOT EXISTS ${table}_change_control_insert
      AFTER INSERT ON ${table}
      BEGIN
        SELECT handle_lix_own_entity_change('${table}', 'insert', ${columns.map((c) => "NEW." + c).join(", ")});
      END;
      
      CREATE TEMP TRIGGER IF NOT EXISTS ${table}_change_control_update
      AFTER UPDATE ON ${table}
      BEGIN
        SELECT handle_lix_own_entity_change('${table}', 'update', ${columns.map((c) => "NEW." + c).join(", ")});
      END;

      CREATE TEMP TRIGGER IF NOT EXISTS ${table}_change_control_delete
      AFTER DELETE ON ${table}
      BEGIN
        SELECT handle_lix_own_entity_change('${table}', 'delete', ${columns.map((c) => "OLD." + c).join(", ")});
      END;
      `;

		sqlite.exec(sql);
	}
}
