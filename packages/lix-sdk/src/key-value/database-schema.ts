import type { Insertable, Selectable, Updateable } from "kysely";
import type { SqliteDatabase } from "sqlite-wasm-kysely";

export function applyKeyValueDatabaseSchema(
	sqlite: SqliteDatabase,
): SqliteDatabase {

	return sqlite.exec`
	CREATE TABLE IF NOT EXISTS key_value (
		key TEXT PRIMARY KEY,
		value TEXT NOT NULL
	) STRICT;

	-- Trigger for INSERT operations
	CREATE TRIGGER IF NOT EXISTS key_value_after_insert_clock_tick
	AFTER INSERT ON key_value
	BEGIN
		INSERT INTO vector_clock (row_id, table_name, operation)
		VALUES (NEW.key, 'key_value', 'INSERT');
	END;

	-- Trigger for UPDATE operations
	CREATE TRIGGER IF NOT EXISTS key_value_after_update_clock_tick
	AFTER UPDATE ON key_value
	BEGIN
		INSERT INTO vector_clock (row_id, table_name, operation)
		VALUES (NEW.key, 'key_value', 'UPDATE');
	END;

	-- Trigger for DELETE operations
	CREATE TRIGGER IF NOT EXISTS key_value_after_delete_clock_tick
	AFTER DELETE ON key_value
	BEGIN
		INSERT INTO vector_clock (row_id, table_name, operation)
		VALUES (OLD.key, 'key_value', 'DELETE');
	END;	

	INSERT OR IGNORE INTO key_value (key, value)
	VALUES ('lix-id', uuid_v4());

`;
}

export type KeyValue = Selectable<KeyValueTable>;
export type NewKeyValue = Insertable<KeyValueTable>;
export type KeyValueUpdate = Updateable<KeyValueTable>;
export type KeyValueTable = {
	/**
	 * The key of the key-value pair.
	 *
	 * Lix prefixes its keys with "lix-" to avoid conflicts with user-defined keys.
	 *
	 * @example
	 *   "namespace-cool-key"
	 */
	key: KeyValueKeys;
	/**
	 * The value of the key-value pair.
	 *
	 * Must be a string. A JSON is a string too ;)
	 *
	 * @example
	 *   "some value"
	 *   "{ "foo": "bar" }"
	 *
	 */
	value: string;
};

type PredefinedKeys = "lix-id";
// The string & {} ensures TypeScript recognizes KeyValueKeys
// as a superset of string, preventing conflicts when using other string values.
type KeyType = string & {};
type KeyValueKeys = PredefinedKeys | KeyType;
