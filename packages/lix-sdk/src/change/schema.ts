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
    schema_version TEXT NOT NULL,
    file_id TEXT NOT NULL,
    plugin_key TEXT NOT NULL,
    snapshot_id TEXT NOT NULL, -- Foreign key to internal_snapshot
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL CHECK (created_at LIKE '%Z'),

    UNIQUE (id, entity_id, file_id, schema_key),
    FOREIGN KEY(snapshot_id) REFERENCES internal_snapshot(id)
  ) STRICT;

  CREATE VIEW IF NOT EXISTS change AS
  SELECT * FROM internal_change;

  CREATE TRIGGER IF NOT EXISTS change_insert
  INSTEAD OF INSERT ON change
  BEGIN
    -- Check if the referenced snapshot exists
    SELECT CASE
      WHEN NOT EXISTS (SELECT 1 FROM internal_snapshot WHERE id = NEW.snapshot_id)
      THEN RAISE(FAIL, 'FOREIGN KEY constraint failed: snapshot_id does not exist')
    END;
    
    INSERT INTO internal_change (
      id,
      entity_id,
      schema_key,
      schema_version,
      file_id,
      plugin_key,
      snapshot_id,
      created_at
    ) VALUES (
      COALESCE(NEW.id, uuid_v7()),
      NEW.entity_id,
      NEW.schema_key,
      NEW.schema_version,
      NEW.file_id,
      NEW.plugin_key,
      NEW.snapshot_id,
      COALESCE(NEW.created_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  END;
`);
}

// Types for the internal_change TABLE
export type InternalChange = Selectable<InternalChangeTable>;
export type NewInternalChange = Insertable<InternalChangeTable>;
export type InternalChangeTable = {
	id: Generated<string>;
	entity_id: string;
	schema_key: string;
	schema_version: string;
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
	schema_version: string;
	file_id: string;
	plugin_key: string;
	snapshot_id: string;
	created_at: Generated<string>;
};