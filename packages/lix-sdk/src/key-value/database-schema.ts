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
`;
}

export type KeyValue = Selectable<KeyValueTable>;
export type NewKeyValue = Insertable<KeyValueTable>;
export type KeyValueUpdate = Updateable<KeyValueTable>;
export type KeyValueTable = {
	key: string;
	value: string;
};
