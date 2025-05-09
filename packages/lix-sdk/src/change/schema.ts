import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Selectable, Insertable, Generated, Updateable } from "kysely";

export function applyInternalChangeDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	return sqlite.exec(`
  CREATE TABLE IF NOT EXISTS internal_snapshot (
    id TEXT PRIMARY KEY,
    content BLOB -- jsonb or binary file
  ) STRICT;

  CREATE TABLE IF NOT EXISTS internal_change (
    id TEXT PRIMARY KEY,
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

  CREATE VIEW snapshot AS
  SELECT * FROM internal_snapshot;

  -- Triggers for 'snapshot' view to make it updatable
  CREATE TRIGGER IF NOT EXISTS snapshot_insert_trigger
  INSTEAD OF INSERT ON snapshot
  FOR EACH ROW
  BEGIN
    INSERT INTO internal_snapshot (id, content)
    VALUES (NEW.id, NEW.content);
  END;

  CREATE TRIGGER IF NOT EXISTS snapshot_update_trigger
  INSTEAD OF UPDATE ON snapshot
  FOR EACH ROW
  BEGIN
    UPDATE internal_snapshot
    SET content = NEW.content
    WHERE id = OLD.id;
  END;

  CREATE TRIGGER IF NOT EXISTS snapshot_delete_trigger
  INSTEAD OF DELETE ON snapshot
  FOR EACH ROW
  BEGIN
    DELETE FROM internal_snapshot
    WHERE id = OLD.id;
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
	file_id: string;
	plugin_key: string;
	snapshot_id: string; // The foreign key
	created_at: Generated<string>;
};

// Types for the internal_snapshot TABLE
export type InternalSnapshot = Selectable<InternalSnapshotTable>;
export type NewInternalSnapshot = Insertable<InternalSnapshotTable>;
export type InternalSnapshotTable = {
	id: Generated<string>;
	content: JSONType;
};

export type Snapshot = Selectable<SnapshotView>;
export type NewSnapshot = Insertable<SnapshotView>;
export type SnapshotView = {
	id: Generated<string>;
	content: JSONType;
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

export type JSONType =
	| string
	| number
	| boolean
	| null
	| JSONType[]
	| { [key: string]: JSONType };
