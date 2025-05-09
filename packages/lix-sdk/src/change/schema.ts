import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Selectable, Insertable, Generated, Updateable } from "kysely";

export function applyChangeDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	return sqlite.exec(`
  CREATE TABLE IF NOT EXISTS internal_change (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    entity_id TEXT NOT NULL,
    schema_key TEXT NOT NULL,
    file_id TEXT NOT NULL,
    plugin_key TEXT NOT NULL,
    snapshot_id TEXT NOT NULL, -- Foreign key to internal_snapshot
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,

    UNIQUE (id, entity_id, file_id, schema_key),
    FOREIGN KEY(snapshot_id) REFERENCES internal_snapshot(id)
  ) STRICT;

  CREATE VIEW change AS
  SELECT * FROM internal_change;
`);
}

// Types for the internal_change TABLE
export type InternalChange = Selectable<InternalChangeTable>;
export type NewInternalChange = Insertable<InternalChangeTable>;
export type InternalChangeTable = {
	id: Generated<string>;
	entity_id: string;
	schema_key: string;
	file_id: string;
	plugin_key: string;
	snapshot_id: string; // The foreign key
	created_at: Generated<string>;
};

export type Change = Selectable<ChangeView>;
export type NewChange = Insertable<ChangeView>;
export type ChangeUpdate = Updateable<ChangeView>;
export type ChangeView = {
	id: Generated<string>;
	entity_id: string;
	schema_key: string;
	file_id: string;
	plugin_key: string;
	snapshot_id: string;
	created_at: Generated<string>;
};