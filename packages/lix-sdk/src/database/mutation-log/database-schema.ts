import type { Insertable, Selectable } from "kysely";
import type { SqliteDatabase } from "sqlite-wasm-kysely";

export function applyMutationLogDatabaseSchema(sqlite: SqliteDatabase): void {
	// TODO SYNC naming - operations might be a better name
	// eslint-disable-next-line @typescript-eslint/no-unused-expressions
	sqlite.exec`
  -- vector clock
  CREATE TABLE IF NOT EXISTS mutation_log (
    row_id TEXT,
    table_name TEXT,
    -- TODO SYNC - we might not need the operation as long as we don't expect a delete operation since we utilize upsert queries anyway
    operation TEXT,
    session TEXT NOT NULL DEFAULT (lix_session()),
    session_time INTEGER NOT NULL DEFAULT (lix_session_clock_tick()),
    wall_clock INTEGER DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') - strftime('%S', 'now')) * 1000)
  ) STRICT;`;

	// const triggerTables: string[] = [
	//   'change',
	//   'account',
	//   'snapshot',
	//   'change_set',
	//   'change_conflict',
	//   'version',

	// TODO persist operations for:
	// change_author -> PRIMARY KEY (change_id, account_id),
	// change_edge -> PRIMARY KEY (parent_id, child_id),
	// change_conflict_resolution -> PRIMARY KEY(change_conflict_id, resolved_change_id),
	// change_set_element -> PRIMARY KEY(change_set_id, change_id),
	// change_set_label -> PRIMARY KEY(label_id, change_set_id)
	// change_set_label_author -> PRIMARY KEY(label_id, change_set_id, account_id),
	// version_change_conflict -> PRIMARY KEY (version_id, change_conflict_id),

	// ]

	const idMap = {
		// file - File is not synced. Is construcuted from the change table. (see https://github.com/opral/monorepo/pull/3242#discussion_r1863981413)
		change: ["id"],
		account: ["id"],
		snapshot: ["id"],
		change_set: ["id"],
		change_conflict: ["id"],
		version: ["id"],
		change_author: ["change_id", "account_id"],
		change_edge: ["parent_id", "child_id"],
		change_conflict_resolution: ["change_conflict_id", "resolved_change_id"],
		change_set_element: ["change_set_id", "change_id"],
		change_set_label: ["label_id", "change_set_id"],
		change_set_label_author: ["label_id", "change_set_id", "account_id"],
		version_change_conflict: ["version_id", "change_conflict_id"],
	};

	sqlite.exec(`
	-- Trigger for INSERT operations
	CREATE TRIGGER IF NOT EXISTS key_value_after_insert_log
	AFTER INSERT ON key_value
	BEGIN
		INSERT INTO mutation_log (row_id, table_name, operation)
		VALUES (NEW.key, 'key_value', 'INSERT');
	END;

	-- Trigger for UPDATE operations
	CREATE TRIGGER IF NOT EXISTS key_value_after_update_log
	AFTER UPDATE ON key_value
	BEGIN
		INSERT INTO mutation_log (row_id, table_name, operation)
		VALUES (NEW.key, 'key_value', 'UPDATE');
	END;

`);

	for (const [tableName, ids] of Object.entries(idMap)) {
		// TODO change to json column instead?
		if (ids.length === 0) {
			throw new Error("at least one id required");
		} else if (ids.length === 1) {
			sqlite.exec(`
        -- Trigger for INSERT operations
        CREATE TRIGGER IF NOT EXISTS ${tableName}_after_insert_log
        AFTER INSERT ON ${tableName}
        BEGIN
            INSERT INTO mutation_log (row_id, table_name, operation)
            VALUES (NEW.id, '${tableName}', 'INSERT');
        END;
    
        -- Trigger for UPDATE operations
        CREATE TRIGGER IF NOT EXISTS ${tableName}_after_update_log
        AFTER UPDATE ON ${tableName}
        BEGIN
            INSERT INTO mutation_log (row_id, table_name, operation)
            VALUES (NEW.id, '${tableName}', 'UPDATE');
        END;
        `);
		} else {
			const idConcatOperation = ids
				.map((id) => `NEW.${id}`)
				.join(" || '__' || ");
			sqlite.exec(`
        -- Trigger for INSERT operations
        CREATE TRIGGER IF NOT EXISTS ${tableName}_after_insert_log
        AFTER INSERT ON ${tableName}
        BEGIN
            INSERT INTO mutation_log (row_id, table_name, operation)
            VALUES (${idConcatOperation}, '${tableName}', 'INSERT');
        END;
    
        -- Trigger for UPDATE operations
        CREATE TRIGGER IF NOT EXISTS ${tableName}_after_update_log
        AFTER UPDATE ON ${tableName}
        BEGIN
            INSERT INTO mutation_log (row_id, table_name, operation)
            VALUES (${idConcatOperation}, '${tableName}', 'UPDATE');
        END;
        `);
		}
	}
}

export type MutationLog = Selectable<MutationLogTable>;
export type NewMutationLog = Insertable<MutationLogTable>;

export type MutationLogTable = {
	row_id: string;
	table_name: string;
	// -1 = delete, 0 = insert, 1 = update
	// TODO SYNC - we might not need the operation as long as we don't expect a delete operation since we utilize upsert queries anyway
	operation: "INSERT" | "UPDATE" | "DELETE";
	session: string;
	session_time: number;
	wall_clock: number;
};
