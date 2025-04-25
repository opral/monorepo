import type { Insertable, Selectable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export const tablesByDepencies: string[] = [
	// no dependencies
	"snapshot",
	"label",
	"version",
	"account",
	"file",
	"change_set",
	"key_value",
	// Depends on: snapshot
	"change",

	// Depends on: file
	"file_queue",
	// Depends on: change
	"change_author",
	// Depends on: change
	"change_edge",
	// Depends on: change_set
	"change_conflict",
	// Depends on: change_conflict, change
	"change_conflict_resolution",
	// Depends on: change_set, change
	"change_set_element",
	// Depends on: label, change_set
	"change_set_label",
	// Depends on: version, change
	"version_change",
	// Depends on: version, change_conflict
	"version_change_conflict",
	// Depends on: version
	"current_version",
];

export const tableIdColumns: Record<string, Array<string>> = {
	// file - File is not synced. Is construcuted from the change table. (see https://github.com/opral/monorepo/pull/3242#discussion_r1863981413)
	change: ["id"],
	snapshot: ["id"],
	change_conflict: ["id"],
	change_edge: ["parent_id", "child_id"],
	change_conflict_resolution: ["change_conflict_id", "resolved_change_id"],
	version_change_conflict: ["version_id", "change_conflict_id"],
	// version_change: ["version_id", "change_id"],
};

export function applyMutationLogDatabaseSchema(
	sqlite: SqliteWasmDatabase
): void {
	// eslint-disable-next-line @typescript-eslint/no-unused-expressions
	sqlite.exec`
  -- vector clock
  CREATE TABLE IF NOT EXISTS mutation_log (
    row_id BLOB,
    table_name TEXT,
    -- TODO SYNC - we might not need the operation as long as we don't expect a delete operation since we utilize upsert queries anyway
    operation TEXT,
    session TEXT NOT NULL DEFAULT (lix_session()),
    session_time INTEGER NOT NULL DEFAULT (lix_session_clock_tick()),
    wall_clock INTEGER DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') - strftime('%S', 'now')) * 1000)
  ) STRICT;
   
  CREATE TRIGGER IF NOT EXISTS ignore_mutation_during_sync
  BEFORE INSERT ON mutation_log
  FOR EACH ROW
  WHEN EXISTS (SELECT 1 FROM mutation_log WHERE table_name = 'mutation_log')
  BEGIN
    SELECT RAISE(IGNORE);
  END;
 
  `;

	for (const [tableName, idColumns] of Object.entries(tableIdColumns)) {
		if (idColumns.length === 0) {
			throw new Error("at least one id required");
		}
		sqlite.exec(`
      -- Trigger for INSERT operations
      CREATE TRIGGER IF NOT EXISTS ${tableName}_after_insert_log
      AFTER INSERT ON ${tableName}
      BEGIN
          INSERT INTO mutation_log (row_id, table_name, operation)
          VALUES (JSONB(${toSqliteJson(idColumns)}), '${tableName}', 'INSERT');
      END;
  
      -- Trigger for UPDATE operations
      CREATE TRIGGER IF NOT EXISTS ${tableName}_after_update_log
      AFTER UPDATE ON ${tableName}
      BEGIN
          INSERT INTO mutation_log (row_id, table_name, operation)
          VALUES (JSONB(${toSqliteJson(idColumns)}), '${tableName}', 'UPDATE');
      END;
    `);
	}
}

export type MutationLog = Selectable<MutationLogTable>;
export type NewMutationLog = Insertable<MutationLogTable>;

export type MutationLogTable = {
	row_id: Record<string, string>;
	table_name: string;
	// -1 = delete, 0 = insert, 1 = update
	// TODO SYNC - we might not need the operation as long as we don't expect a delete operation since we utilize upsert queries anyway
	operation: "INSERT" | "UPDATE";
	session: string;
	session_time: number;
	wall_clock: number;
};

function toSqliteJson(keyColumns: string[]) {
	if (keyColumns.length === 0) {
		throw new Error("Key columns array cannot be empty.");
	}

	const jsonObjectArgs = keyColumns.map(
		(keyColumnName) => `'${keyColumnName}', NEW.${keyColumnName}`
	);

	const jsonObjectExpression = "json_object(" + jsonObjectArgs.join(", ") + ")";
	return jsonObjectExpression;
}
