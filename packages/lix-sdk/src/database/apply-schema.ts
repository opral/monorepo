import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { applyAccountDatabaseSchema } from "../account/database-schema.js";
import { applyKeyValueDatabaseSchema } from "../key-value/database-schema.js";
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

  -- labels
  
  CREATE TABLE IF NOT EXISTS label (
    id TEXT PRIMARY KEY DEFAULT (nano_id(8)),
    
    name TEXT NOT NULL UNIQUE  -- e.g., 'checkpoint', 'reviewed'
    
  ) STRICT;

  INSERT OR IGNORE INTO label (name) VALUES ('checkpoint');

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
	applyChangeSetEdgeDatabaseSchema(args.sqlite);
	applyVersionV2DatabaseSchema(args.sqlite, args.db);
	applyOwnChangeControlTriggers(args.sqlite, args.db);

	return args.sqlite;
}
