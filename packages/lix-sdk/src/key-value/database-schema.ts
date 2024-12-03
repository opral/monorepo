import type { Insertable, Selectable, Updateable } from "kysely";
import type { SqliteDatabase } from "sqlite-wasm-kysely";

export function applyKeyValueDatabaseSchema(
	sqlite: SqliteDatabase
): SqliteDatabase {
	return sqlite.exec`
	CREATE TABLE IF NOT EXISTS key_value (
		key TEXT PRIMARY KEY,
		value TEXT NOT NULL
	) STRICT;

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
