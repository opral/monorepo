import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Selectable, Insertable, Generated } from "kysely";

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

  -- add a table we use within the transaction
  -- which is used by the state logic
  -- defined here to avoid circular dependencies
  CREATE TABLE IF NOT EXISTS internal_change_in_transaction (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    entity_id TEXT NOT NULL,
    schema_key TEXT NOT NULL,
    schema_version TEXT NOT NULL,
    file_id TEXT NOT NULL,
    plugin_key TEXT NOT NULL,
    version_id TEXT NOT NULL,
    snapshot_content BLOB,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL CHECK (created_at LIKE '%Z'),
    --- NOTE schena_key must be unique per entity_id and file_id in the transaction
    UNIQUE(entity_id, file_id, schema_key, version_id)
  ) STRICT;

  CREATE VIEW IF NOT EXISTS change AS
  SELECT 
    c.id,
    c.entity_id,
    c.schema_key,
    c.schema_version,
    c.file_id,
    c.plugin_key,
    c.created_at,
    (SELECT json(s.content)
     FROM internal_snapshot s
     WHERE s.id = c.snapshot_id) AS snapshot_content
  FROM internal_change AS c
  UNION ALL
  SELECT 
    t.id,
    t.entity_id,
    t.schema_key,
    t.schema_version,
    t.file_id,
    t.plugin_key,
    t.created_at,
    CASE 
      WHEN t.snapshot_content IS NULL THEN NULL
      ELSE json(t.snapshot_content)
    END AS snapshot_content
  FROM internal_change_in_transaction AS t;

  CREATE TRIGGER IF NOT EXISTS change_insert
  INSTEAD OF INSERT ON change
  BEGIN
    -- Insert the snapshot first (if there's content)
    INSERT INTO internal_snapshot (id, content)
    SELECT 
      uuid_v7(), 
      jsonb(NEW.snapshot_content)
    WHERE NEW.snapshot_content IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM internal_snapshot WHERE id = 'no-content' AND NEW.snapshot_content IS NULL);
    
    -- Insert the change, referencing the snapshot
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
      CASE 
        WHEN NEW.snapshot_content IS NULL THEN 'no-content'
        ELSE (SELECT id FROM internal_snapshot WHERE content = jsonb(NEW.snapshot_content) ORDER BY id DESC LIMIT 1)
      END,
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
export type ChangeView = {
	id: Generated<string>;
	entity_id: string;
	schema_key: string;
	schema_version: string;
	file_id: string;
	plugin_key: string;
	created_at: Generated<string>;
	snapshot_content: Record<string, any> | null;
};
