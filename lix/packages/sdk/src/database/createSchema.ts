import { sql, type Kysely } from "kysely";

export async function createSchema(args: { db: Kysely<any> }) {
	return await sql`
  CREATE TABLE ref (
    name TEXT PRIMARY KEY,
    commit_id TEXT
  );

  CREATE TABLE file_internal (
    id TEXT PRIMARY KEY DEFAULT (uuid_v4()),
    path TEXT NOT NULL UNIQUE,
    data BLOB NOT NULL,
    metadata TEXT  -- Added metadata field
  ) strict;

  CREATE TABLE change_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id TEXT,
    path TEXT NOT NULL,
    data BLOB,
    metadata TEXT  -- Added metadata field
  ) strict;

  create view file as
    select z.id as id, z.path as path, z.data as data, z.metadata as metadata, MAX(z.mx) as queue_id from 
      (select file_id as id, path, data, metadata, id as mx from change_queue UNION select id, path, data, metadata, 0 as mx from file_internal) as z
    group by z.id;
  
  CREATE TABLE change (
    id TEXT PRIMARY KEY DEFAULT (uuid_v4()),
    author TEXT,
    parent_id TEXT,
    type TEXT NOT NULL,
    file_id TEXT NOT NULL,
    plugin_key TEXT NOT NULL,
    operation TEXT NOT NULL,
    value TEXT,
    valueB BLOB,

    meta TEXT,
    commit_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
  ) strict;

  CREATE INDEX IF NOT EXISTS idx_change_parent_id ON change (parent_id);
  CREATE TABLE conflict (
    change_id TEXT NOT NULL,
    conflicting_change_id TEXT NOT NULL,
    reason TEXT,
    meta TEXT,
    resolved_with_change_id TEXT,
    PRIMARY KEY (change_id, conflicting_change_id)
  ) strict;
    
  CREATE TABLE 'commit' (
    id TEXT PRIMARY KEY DEFAULT (uuid_v4()),
    author TEXT,
    parent_id TEXT NOT NULL,
    description TEXT NOT NULL,
    created TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
  ) strict;

  INSERT INTO ref values ('current', '00000000-0000-0000-0000-000000000000');

  CREATE TRIGGER file_update INSTEAD OF UPDATE ON file
  BEGIN
    insert into change_queue(file_id, path, data, metadata) values(NEW.id, NEW.path, NEW.data, NEW.metadata);
    select triggerWorker();
  END;

  CREATE TRIGGER file_insert INSTEAD OF INSERT ON file
  BEGIN
    insert into change_queue(file_id, path, data, metadata) values(NEW.id, NEW.path, NEW.data, NEW.metadata);
    select triggerWorker();
  END;

  CREATE TRIGGER change_queue_remove BEFORE DELETE ON change_queue
  BEGIN
    insert or replace into file_internal(id, path, data, metadata) values(OLD.file_id, OLD.path, OLD.data, OLD.metadata);
  END;


  -- change discussions 

  CREATE TABLE discussion (
    -- TODO https://github.com/opral/lix-sdk/issues/74 replace with uuid_v7
    id TEXT PRIMARY KEY DEFAULT (uuid_v4())
  ) strict;

  CREATE TABLE discussion_change_map (
    discussion_id TEXT NOT NULL,
    change_id TEXT NOT NULL,

    FOREIGN KEY(discussion_id) REFERENCES discussion(id),
    
    -- NOTE this will prevent us from dropping changes 
    FOREIGN KEY(change_id) REFERENCES change(id)
  ) strict;


  CREATE TABLE comment (
    --- TODO in inlang i saw we replace uuid_v3 with uuid_v7 any reason we use v4 in lix?
    id TEXT PRIMARY KEY DEFAULT (uuid_v4()),
    parent_id TEXT,
    discussion_id TEXT NULL,
    author_id TEXT NOT NULL, 
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    body TEXT NOT NULL,

    FOREIGN KEY(discussion_id) REFERENCES discussion(id)
  ) strict;

`.execute(args.db);
}

