import type { SqliteDatabase } from "sqlite-wasm-kysely";

/**
 * Applies the database schema to the given sqlite database.
 */
export async function applySchema(args: {
	sqlite: SqliteDatabase;
}): Promise<unknown> {
	return args.sqlite.exec`

  PRAGMA foreign_keys = ON;

  -- file

  CREATE TABLE IF NOT EXISTS file (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    path TEXT NOT NULL UNIQUE,
    data BLOB NOT NULL,
    metadata TEXT
  ) strict;

  -- TODO Queue - handle deletion - the current queue doesn't handle delete starting with feature parity
    -- CREATE TRIGGER IF NOT EXISTS file_delete BEFORE DELETE ON file
    -- WHEN NEW.skip_change_extraction IS NULL
    -- BEGIN
    --     INSERT INTO change_queue(file_id, path, data_before, data_after, metadata)
    --     VALUES (OLD.id, OLD.path, OLD.data, NULL, OLD.metadata);
    --   SELECT triggerChangeQueue();
    -- END;

  CREATE TABLE IF NOT EXISTS change_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id TEXT NOT NULL,
    data_before BLOB,
    data_after BLOB,
    path_before TEXT,
    path_after TEXT,
    metadata_before TEXT,
    metadata_after TEXT
  ) strict;

  CREATE TRIGGER IF NOT EXISTS file_insert BEFORE INSERT ON file
  BEGIN
    INSERT INTO change_queue(
      file_id, path_after, data_after, metadata_after
    )
    VALUES (
      NEW.id, NEW.path, NEW.data, NEW.metadata
    );
    SELECT triggerChangeQueue();
  END;

  CREATE TRIGGER IF NOT EXISTS file_update BEFORE UPDATE ON file
  BEGIN
    INSERT INTO change_queue(
      file_id, 
      path_before, data_before, metadata_before, 
      path_after, data_after, metadata_after
    )

    VALUES (
      NEW.id, 
      OLD.path, OLD.data, OLD.metadata,
      NEW.path, NEW.data, NEW.metadata
    );

    SELECT triggerChangeQueue();
  END;

  CREATE TABLE IF NOT EXISTS change (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    entity_id TEXT NOT NULL,
    schema_key TEXT NOT NULL,
    file_id TEXT NOT NULL,
    plugin_key TEXT NOT NULL,
    snapshot_id TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,

    UNIQUE (id, entity_id, file_id, schema_key),
    FOREIGN KEY(snapshot_id) REFERENCES snapshot(id)
  ) strict;

  CREATE TABLE IF NOT EXISTS change_edge (
    parent_id TEXT NOT NULL,
    child_id TEXT NOT NULL,
    
    PRIMARY KEY (parent_id, child_id),
    FOREIGN KEY(parent_id) REFERENCES change(id),
    FOREIGN KEY(child_id) REFERENCES change(id),
    -- Prevent self referencing edges
    CHECK (parent_id != child_id)
  ) strict;

  CREATE TABLE IF NOT EXISTS snapshot (
    id TEXT GENERATED ALWAYS AS (sha256(content)) STORED UNIQUE,
    content TEXT
  ) strict;

  -- Create the default 'no-content' snapshot
  -- to avoid foreign key constraint violations in tests
  INSERT OR IGNORE INTO snapshot (content) VALUES (NULL);

  -- conflicts

  CREATE INDEX IF NOT EXISTS idx_content_hash ON snapshot (id);

  CREATE TABLE IF NOT EXISTS change_conflict (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    key TEXT NOT NULL,
    change_set_id TEXT NOT NULL,

    FOREIGN KEY(change_set_id) REFERENCES change_set(id)
  ) strict;

  CREATE TABLE IF NOT EXISTS change_conflict_resolution (
    change_conflict_id TEXT NOT NULL,
    resolved_change_id TEXT NOT NULL,

    -- potential future columns
    -- resolved_by <account_id>
    -- resolved_at <timestamp>

    PRIMARY KEY(change_conflict_id, resolved_change_id),
    FOREIGN KEY(change_conflict_id) REFERENCES change_conflict(id),
    FOREIGN KEY(resolved_change_id) REFERENCES change(id)
  ) strict;

  -- change sets

  CREATE TABLE IF NOT EXISTS change_set (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7())
  ) strict;

  CREATE TABLE IF NOT EXISTS change_set_element (
    change_set_id TEXT NOT NULL,
    change_id TEXT NOT NULL,

    UNIQUE(change_set_id, change_id),
    FOREIGN KEY(change_set_id) REFERENCES change_set(id),    
    FOREIGN KEY(change_id) REFERENCES change(id)
  ) strict;

  CREATE TABLE IF NOT EXISTS change_set_label (
    label_id TEXT NOT NULL,
    change_set_id TEXT NOT NULL,
    
    FOREIGN KEY(label_id) REFERENCES label(id),
    FOREIGN KEY(change_set_id) REFERENCES change_set(id),
    PRIMARY KEY(label_id, change_set_id)
  ) strict;

  -- discussions 

  CREATE TABLE IF NOT EXISTS discussion (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    change_set_id TEXT NOT NULL,

    FOREIGN KEY(change_set_id) REFERENCES change_set(id)
  ) strict;

  CREATE TABLE IF NOT EXISTS comment (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    parent_id TEXT,
    discussion_id TEXT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    content TEXT NOT NULL,

    FOREIGN KEY(discussion_id) REFERENCES discussion(id),
    FOREIGN KEY(parent_id) REFERENCES comment(id)
  ) strict;

  -- labels
  
  CREATE TABLE IF NOT EXISTS label (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    name TEXT NOT NULL UNIQUE  -- e.g., 'confirmed', 'reviewed'
  ) strict;

  INSERT OR IGNORE INTO label (name) VALUES ('confirmed');
  INSERT OR IGNORE INTO label (name) VALUES ('grouped');

  -- versions

  CREATE TABLE IF NOT EXISTS version (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    change_set_id TEXT NOT NULL,

    -- name is optional. 
    -- 
    -- "anonymous" versiones can ease workflows. 
    -- For example, a user can create a version 
    -- without a name to experiment with
    -- changes with no mental overhead of 
    -- naming the version.
    name TEXT,

    FOREIGN KEY(change_set_id) REFERENCES change_set(id),

    -- Assuming mutable change sets. 
    -- If change sets are immutable,
    -- remove the UNIQUE constraint
    -- and update version pointers to 
    -- create a new change set on updates
    UNIQUE (id, change_set_id)
  ) strict;

  CREATE TABLE IF NOT EXISTS version_change_conflict (
    version_id TEXT NOT NULL,
    change_conflict_id TEXT NOT NULL,

    PRIMARY KEY (version_id, change_conflict_id),
    FOREIGN KEY (version_id) REFERENCES version(id),
    FOREIGN KEY (change_conflict_id) REFERENCES change_conflict(id)
  ) strict;

  -- only one version can be active at a time
  -- hence, the table has only one row
  CREATE TABLE IF NOT EXISTS current_version (
    id TEXT NOT NULL PRIMARY KEY,

    FOREIGN KEY(id) REFERENCES version(id)
  ) strict;

  -- Insert the default version if missing
  -- (this is a workaround for not having a separata creation and migration schema's)

  INSERT INTO change_set (id)
  SELECT '01932cf1-f717-75e5-8513-dc6a0867b1ee'
  WHERE NOT EXISTS (SELECT 1 FROM change_set);

  INSERT INTO version (id, change_set_id, name)
  SELECT '019328cc-ccb0-7f51-96e8-524df4597ac6', '01932cf1-f717-75e5-8513-dc6a0867b1ee', 'main'
  WHERE NOT EXISTS (SELECT 1 FROM version);

  -- Set the default current version to 'main' if both tables are empty
  -- (this is a workaround for not having a separata creation and migration schema's)
  INSERT INTO current_version (id)
  SELECT '019328cc-ccb0-7f51-96e8-524df4597ac6'
  WHERE NOT EXISTS (SELECT 1 FROM current_version);

`;
}
