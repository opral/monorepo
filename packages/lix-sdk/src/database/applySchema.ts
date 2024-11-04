import type { SqliteDatabase } from "sqlite-wasm-kysely";

/**
 * Applies the database schema to the given sqlite database.
 */
export async function applySchema(args: { sqlite: SqliteDatabase }) {
	return args.sqlite.exec`

  CREATE TABLE IF NOT EXISTS file_internal (
    id TEXT PRIMARY KEY DEFAULT (uuid_v4()),
    path TEXT NOT NULL UNIQUE,
    data BLOB NOT NULL,
    metadata TEXT  -- Added metadata field
  ) strict;

  CREATE TABLE IF NOT EXISTS change_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id TEXT,
    path TEXT NOT NULL,
    data BLOB,
    metadata TEXT  -- Added metadata field
  ) strict;

  create view IF NOT EXISTS file as
    select z.id as id, z.path as path, z.data as data, z.metadata as metadata, MAX(z.mx) as queue_id from 
      (select file_id as id, path, data, metadata, id as mx from change_queue UNION select id, path, data, metadata, 0 as mx from file_internal) as z
    group by z.id;
  
  CREATE TABLE IF NOT EXISTS change (
    id TEXT PRIMARY KEY DEFAULT (uuid_v4()),
    entity_id TEXT NOT NULL,
    type TEXT NOT NULL,
    file_id TEXT NOT NULL,
    plugin_key TEXT NOT NULL,
    snapshot_id TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,

    UNIQUE (id, entity_id, file_id, type)
  ) strict;

  CREATE TABLE IF NOT EXISTS change_graph_edge (
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

  -- conflicts

  CREATE INDEX IF NOT EXISTS idx_content_hash ON snapshot (id);

  CREATE TABLE IF NOT EXISTS conflict (
    change_id TEXT NOT NULL,
    conflicting_change_id TEXT NOT NULL,
    reason TEXT,
    metadata TEXT,
    resolved_change_id TEXT,
    PRIMARY KEY (change_id, conflicting_change_id)
  ) strict;

  CREATE TRIGGER IF NOT EXISTS file_update INSTEAD OF UPDATE ON file
  BEGIN
    insert into change_queue(file_id, path, data, metadata) values(NEW.id, NEW.path, NEW.data, NEW.metadata);
    select triggerWorker();
  END;

  CREATE TRIGGER IF NOT EXISTS file_insert INSTEAD OF INSERT ON file
  BEGIN
    insert into change_queue(file_id, path, data, metadata) values(NEW.id, NEW.path, NEW.data, NEW.metadata);
    select triggerWorker();
  END;

  CREATE TRIGGER IF NOT EXISTS change_queue_remove BEFORE DELETE ON change_queue
  BEGIN
    insert or replace into file_internal(id, path, data, metadata) values(OLD.file_id, OLD.path, OLD.data, OLD.metadata);
  END;

  -- change sets

  CREATE TABLE IF NOT EXISTS change_set (
    id TEXT PRIMARY KEY DEFAULT (uuid_v4())
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
    id TEXT PRIMARY KEY DEFAULT (uuid_v4()),
    change_set_id TEXT NOT NULL,

    FOREIGN KEY(change_set_id) REFERENCES change_set(id)
  ) strict;

  CREATE TABLE IF NOT EXISTS comment (
    id TEXT PRIMARY KEY DEFAULT (uuid_v4()),
    parent_id TEXT,
    discussion_id TEXT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    content TEXT NOT NULL,

    FOREIGN KEY(discussion_id) REFERENCES discussion(id)
  ) strict;

  -- labels
  
  CREATE TABLE IF NOT EXISTS label (
    id TEXT PRIMARY KEY DEFAULT (uuid_v4()),
    name TEXT NOT NULL UNIQUE  -- e.g., 'confirmed', 'reviewed'
  ) strict;

  INSERT OR IGNORE INTO label (name) VALUES ('confirmed');

  -- branches

  CREATE TABLE IF NOT EXISTS branch (
    id TEXT PRIMARY KEY DEFAULT (uuid_v4()),

    -- name is optional. 
    -- 
    -- "anonymous" branches can ease workflows. 
    -- For example, a user can create a branch 
    -- without a name to experiment with
    -- changes with no mental overhead of 
    -- naming the branch.
    name TEXT
  
  ) strict;

  CREATE TABLE IF NOT EXISTS branch_change_pointer (
    branch_id TEXT NOT NULL,
    change_id TEXT NOT NULL,
    change_file_id TEXT NOT NULL,
    change_entity_id TEXT NOT NULL,
    change_type TEXT NOT NULL,

    PRIMARY KEY(branch_id, change_file_id, change_entity_id, change_type),

    FOREIGN KEY(branch_id) REFERENCES branch(id),
    FOREIGN KEY(change_id, change_file_id, change_entity_id, change_type) REFERENCES change(change_id, change_file_id, change_entity_id, change_type)
  ) strict;

  -- only one branch can be active at a time
  -- hence, the table has only one row
  CREATE TABLE IF NOT EXISTS current_branch (
    id TEXT NOT NULL PRIMARY KEY,

    FOREIGN KEY(id) REFERENCES branch(id)
  ) strict;

  -- Create a default branch (using a pre-defined id to avoid duplicate inserts)
  INSERT OR IGNORE INTO branch (id, name) VALUES ('00000000-0000-0000-0000-000000000000','main');
  INSERT OR IGNORE INTO current_branch (id) VALUES ('00000000-0000-0000-0000-000000000000');
`;
}

