import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export function applyKeyValueDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	return sqlite.exec`
	CREATE TABLE IF NOT EXISTS key_value (
		key TEXT PRIMARY KEY,
		value TEXT NOT NULL,

		-- Options
		skip_change_control INT DEFAULT FALSE
	) STRICT;

	INSERT OR IGNORE INTO key_value (key, value)
	VALUES ('lix_id', nano_id(18));

	-- default value for lix sync to false
	-- if not exist to remove conditional logic
	-- if the key exists or not
	INSERT OR IGNORE INTO key_value (key, value, skip_change_control)
	VALUES ('lix_sync', 'false', 1);
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
	/**
	 * If `true`, the key-value pair is not tracked with own change control.
	 *
	 * Carefull (!) when querying the database. The return value will be `0` or `1`.
	 * SQLite does not have a boolean select type https://www.sqlite.org/datatype3.html.
	 *
	 * @default false
	 */
	skip_change_control: Generated<boolean>;
};

type PredefinedKeys =
	| "lix_id"
	| "lix_server_url"
	| "lix_sync"
	| "lix_log_levels";
// The string & {} ensures TypeScript recognizes KeyValueKeys
// as a superset of string, preventing conflicts when using other string values.
type KeyType = string & {};
type KeyValueKeys = PredefinedKeys | KeyType;
