import type { SqliteDatabase } from "sqlite-wasm-kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import { handleLixOwnEntityChange } from "./handle-lix-own-entity-change.js";
import type { Kysely } from "kysely";

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

export const changeControlledTables: Partial<{
	[K in keyof LixDatabaseSchema]: TableColumns<LixDatabaseSchema[K]>;
}> = {
	account: ["id", "name"],
	comment: [
		"id",
		"content",
		"created_at",
		"created_by",
		"parent_id",
		"discussion_id",
	],
	change_set: ["id"],
	change_author: ["change_id", "account_id"],
	change_set_element: ["change_set_id", "change_id"],
	change_set_label: ["label_id", "change_set_id"],
	change_set_label_author: ["label_id", "change_set_id", "account_id"],
	discussion: ["id", "change_set_id"],
	// file: ["id", "path", "metadata"],
	key_value: ["key", "value"],
	version: ["id", "name"],
};

export const changeControlledTableIds: Partial<{
	[K in keyof LixDatabaseSchema]: TableColumns<LixDatabaseSchema[K]>;
}> = {
	account: ["id"],
	comment: ["id"],
	change_set: ["id"],
	change_author: ["change_id", "account_id"],
	change_set_element: ["change_set_id", "change_id"],
	change_set_label: ["label_id", "change_set_id"],
	change_set_label_author: ["label_id", "change_set_id", "account_id"],
	discussion: ["id"],
	file: ["id"],
	key_value: ["key"],
	version: ["id"],
}; 

type TableColumns<T> = T extends Record<string, any>
  ? (keyof T)[]
  : never;


// const tables = new Map<keyof LixDatabaseSchema, string[]>([
// 	["change", ["id"]],
// 	["account", ["id"]],
// 	["version", ["id"]],
// 	["snapshot", ["id"]],

// 	["change_set", ["id"]],
// 	["change_conflict", ["id"]],
// 	["change_author", ["change_id", "account_id"]],
// 	["change_edge", ["parent_id", "child_id"]],
// 	["change_conflict_resolution", ["change_conflict_id", "resolved_change_id"]],
// 	["change_set_element", ["change_set_id", "change_id"]],
// 	["change_set_label", ["label_id", "change_set_id"]],
// 	["change_set_label_author", ["label_id", "change_set_id", "account_id"]],
// 	["version_change_conflict", ["version_id", "change_conflict_id"]],
// 	["version_change", ["version_id", "change_id"]],
// 	["key_value", ["key"]],
// ]);