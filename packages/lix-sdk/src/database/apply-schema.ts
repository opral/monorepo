import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { applyAccountDatabaseSchema } from "../account/database-schema.js";
import { applyKeyValueDatabaseSchema } from "../key-value/database-schema.js";
import { applyMutationLogDatabaseSchema } from "./mutation-log/database-schema.js";
import { applyChangeProposalDatabaseSchema } from "../change-proposal/database-schema.js";
import { applyChangeSetEdgeDatabaseSchema } from "../change-set-edge/database-schema.js";
import { applyVersionV2DatabaseSchema } from "../version-v2/database-schema.js";
import { applyChangeSetDatabaseSchema } from "../change-set/database-schema.js";
import { applyFileQueueDatabaseSchema } from "../file-queue/database-schema.js";
import type { Kysely } from "kysely";
import type { LixDatabaseSchema } from "./schema.js";
import { applyOwnChangeControlTriggers } from "../own-change-control/database-triggers.js";
import { applyThreadDatabaseSchema } from "../thread/database-schema.js";

/**
 * Applies the database schema to the given sqlite database.
 */
export function applySchema(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<LixDatabaseSchema>;
}): SqliteWasmDatabase {
	applyAccountDatabaseSchema(args.sqlite);
	applyKeyValueDatabaseSchema(args.sqlite);
	applyThreadDatabaseSchema(args.sqlite);

	// eslint-disable-next-line @typescript-eslint/no-unused-expressions
	args.sqlite.exec`

  PRAGMA foreign_keys = ON;
  PRAGMA auto_vacuum = 2; -- incremental https://www.sqlite.org/pragma.html#pragma_auto_vacuum
 
  -- file

  CREATE TABLE IF NOT EXISTS file (
    id TEXT PRIMARY KEY DEFAULT (nano_id(10)),
    path TEXT NOT NULL UNIQUE,
    data BLOB NOT NULL,
    metadata BLOB,
    

    CHECK (is_valid_file_path(path))
  ) STRICT;

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
  ) STRICT;

  CREATE TABLE IF NOT EXISTS change_author (
    change_id TEXT NOT NULL,
    account_id TEXT NOT NULL,

    PRIMARY KEY (change_id, account_id),
    FOREIGN KEY(change_id) REFERENCES change(id),
    FOREIGN KEY(account_id) REFERENCES account(id)
  ) strict;

  CREATE TABLE IF NOT EXISTS change_edge (
    parent_id TEXT NOT NULL,
    child_id TEXT NOT NULL,
    
    PRIMARY KEY (parent_id, child_id),
    FOREIGN KEY(parent_id) REFERENCES change(id),
    FOREIGN KEY(child_id) REFERENCES change(id),
    -- Prevent self referencing edges
    CHECK (parent_id != child_id)
  ) STRICT;

  CREATE TABLE IF NOT EXISTS snapshot (
    id TEXT GENERATED ALWAYS AS (json_sha256(content)) STORED UNIQUE,
    content BLOB
  ) STRICT;

  -- Create the default 'no-content' snapshot
  -- to avoid foreign key constraint violations in tests
  INSERT OR IGNORE INTO snapshot (content) VALUES (NULL);
  `;

	applyChangeSetDatabaseSchema(args.sqlite);
	// eslint-disable-next-line @typescript-eslint/no-unused-expressions
	args.sqlite.exec`
  -- conflicts

  CREATE INDEX IF NOT EXISTS idx_content_hash ON snapshot (id);

  CREATE TABLE IF NOT EXISTS change_conflict (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    
    key TEXT NOT NULL,
    change_set_id TEXT NOT NULL,
    FOREIGN KEY(change_set_id) REFERENCES change_set(id)
  ) STRICT;

  CREATE TABLE IF NOT EXISTS change_conflict_resolution (
    change_conflict_id TEXT NOT NULL,
    resolved_change_id TEXT NOT NULL,
    
    -- potential future columns
    -- resolved_by <account_id>
    -- resolved_at <timestamp>

    PRIMARY KEY(change_conflict_id, resolved_change_id),
    FOREIGN KEY(change_conflict_id) REFERENCES change_conflict(id),
    FOREIGN KEY(resolved_change_id) REFERENCES change(id)
  ) STRICT;

  -- labels
  
  CREATE TABLE IF NOT EXISTS label (
    id TEXT PRIMARY KEY DEFAULT (nano_id(8)),
    
    name TEXT NOT NULL UNIQUE  -- e.g., 'checkpoint', 'reviewed'
    
  ) STRICT;

  INSERT OR IGNORE INTO label (name) VALUES ('checkpoint');

  -- versions

  CREATE TABLE IF NOT EXISTS version (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),

    name TEXT NOT NULL UNIQUE DEFAULT (human_id())
  ) STRICT;

  CREATE TABLE IF NOT EXISTS version_change (
    version_id TEXT NOT NULL,
    change_id TEXT NOT NULL,

    entity_id TEXT NOT NULL,
    schema_key TEXT NOT NULL,
    file_id TEXT NOT NULL,

    PRIMARY KEY (version_id, change_id),
    FOREIGN KEY (version_id) REFERENCES version(id) ON DELETE CASCADE,
    FOREIGN KEY (change_id, entity_id, schema_key, file_id) REFERENCES change(id, entity_id, schema_key, file_id) ON DELETE CASCADE,

    UNIQUE (version_id, entity_id, schema_key, file_id)
  ) STRICT;

  CREATE TABLE IF NOT EXISTS version_change_conflict (
    version_id TEXT NOT NULL,
    change_conflict_id TEXT NOT NULL,

    PRIMARY KEY (version_id, change_conflict_id),
    FOREIGN KEY (version_id) REFERENCES version(id),
    FOREIGN KEY (change_conflict_id) REFERENCES change_conflict(id)
  ) STRICT;

  -- only one version can be active at a time
  -- hence, the table has only one row
  CREATE TABLE IF NOT EXISTS current_version (
    id TEXT NOT NULL PRIMARY KEY,

    FOREIGN KEY(id) REFERENCES version(id)
  ) STRICT;

  -- Insert the default version if missing
  -- (this is a workaround for not having a separata creation and migration schema's)

  INSERT INTO version (id, name)
  SELECT '019328cc-ccb0-7f51-96e8-524df4597ac6', 'main'
  WHERE NOT EXISTS (SELECT 1 FROM version);

  -- Set the default current version to 'main' if both tables are empty
  -- (this is a workaround for not having a separata creation and migration schema's)
  INSERT INTO current_version (id)
  SELECT '019328cc-ccb0-7f51-96e8-524df4597ac6'
  WHERE NOT EXISTS (SELECT 1 FROM current_version);


  CREATE TEMP TRIGGER IF NOT EXISTS insert_account_if_not_exists_on_change_author
  BEFORE INSERT ON change_author
  FOR EACH ROW
  WHEN NEW.account_id NOT IN (SELECT id FROM account) AND NEW.account_id IN (SELECT id FROM temp.active_account)
  BEGIN
    INSERT OR IGNORE INTO account
      SELECT 
      *
      FROM active_account 
      WHERE id = NEW.account_id;
  END;
  `;

	applyFileQueueDatabaseSchema(args.sqlite);
	applyChangeProposalDatabaseSchema(args.sqlite);
	applyMutationLogDatabaseSchema(args.sqlite);
	applyChangeSetEdgeDatabaseSchema(args.sqlite);
	applyVersionV2DatabaseSchema(args.sqlite, args.db);
	applyOwnChangeControlTriggers(args.sqlite, args.db);

	return args.sqlite;
}
