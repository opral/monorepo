import type { SqliteWasmDatabase } from "../database/sqlite/index.js";
import type { Selectable, Insertable, Generated } from "kysely";

export function applyChangeDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	return sqlite.exec(`
  CREATE TABLE IF NOT EXISTS internal_change (
    id TEXT PRIMARY KEY DEFAULT (lix_uuid_v7()),
    entity_id TEXT NOT NULL,
    schema_key TEXT NOT NULL,
    schema_version TEXT NOT NULL,
    file_id TEXT NOT NULL,
    plugin_key TEXT NOT NULL,
    snapshot_id TEXT NOT NULL, -- Foreign key to internal_snapshot
    metadata BLOB,
    created_at TEXT DEFAULT (lix_timestamp()) NOT NULL CHECK (created_at LIKE '%Z'),

    UNIQUE (id, entity_id, file_id, schema_key),
    FOREIGN KEY(snapshot_id) REFERENCES internal_snapshot(id)
  ) STRICT;

  CREATE VIEW IF NOT EXISTS change AS
  SELECT 
    c.id,
    c.entity_id,
    c.schema_key,
    c.schema_version,
    c.file_id,
    c.plugin_key,
    json(c.metadata) AS metadata,
    c.created_at,
    json(s.content) AS snapshot_content
  FROM 
    internal_change AS c
  LEFT JOIN 
    internal_snapshot AS s ON s.id = c.snapshot_id

  UNION ALL

  SELECT 
    t.id,
    t.entity_id,
    t.schema_key,
    t.schema_version,
    t.file_id,
    t.plugin_key,
    json(t.metadata) AS metadata,
    t.created_at,
    json(t.snapshot_content) AS snapshot_content
  FROM 
    internal_transaction_state AS t
  WHERE t.untracked = 0;

  CREATE TRIGGER IF NOT EXISTS change_insert
  INSTEAD OF INSERT ON change
  BEGIN
    -- Insert the snapshot first (if there's content)
    INSERT INTO internal_snapshot (id, content)
    SELECT 
      lix_uuid_v7(), 
      jsonb(NEW.snapshot_content)
    WHERE NEW.snapshot_content IS NOT NULL;

    -- Insert the change, referencing the last inserted snapshot (or 'no-content')
    INSERT INTO internal_change (
      id,
      entity_id,
      schema_key,
      schema_version,
      file_id,
      plugin_key,
      snapshot_id,
      metadata,
      created_at
    ) VALUES (
      COALESCE(NEW.id, lix_uuid_v7()),
      NEW.entity_id,
      NEW.schema_key,
      NEW.schema_version,
      NEW.file_id,
      NEW.plugin_key,
      CASE 
        WHEN NEW.snapshot_content IS NULL THEN 'no-content'
        ELSE (SELECT id FROM internal_snapshot WHERE rowid = last_insert_rowid())
      END,
      CASE
        WHEN NEW.metadata IS NULL THEN NULL
        ELSE jsonb(NEW.metadata)
      END,
      COALESCE(NEW.created_at, lix_timestamp())
    );
  END;
`);
}

// Types for the internal_change TABLE
export type InternalChangeTable = {
	id: Generated<string>;
	entity_id: string;
	schema_key: string;
	schema_version: string;
	file_id: string;
	plugin_key: string;
	snapshot_id: string; // The foreign key
	metadata?: Record<string, any> | null;
	created_at: Generated<string>;
};
