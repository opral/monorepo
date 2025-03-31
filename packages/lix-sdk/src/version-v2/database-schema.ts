import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export function applyVersionV2DatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	const sql = `
  CREATE TABLE IF NOT EXISTS version_v2 (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    name TEXT UNIQUE DEFAULT (human_id()),
    change_set_id TEXT NOT NULL,

    FOREIGN KEY(change_set_id) REFERENCES change_set(id)
  ) STRICT;
`;

	return sqlite.exec(sql);
}

export type VersionV2 = Selectable<VersionV2Table>;
export type NewVersionV2 = Insertable<VersionV2Table>;
export type VersionV2Update = Updateable<VersionV2Table>;
export type VersionV2Table = {
	id: Generated<string>;
	name: string | null;
	change_set_id: string;
};
