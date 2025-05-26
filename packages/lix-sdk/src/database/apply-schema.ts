import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Kysely } from "kysely";
import { LixSchemaViewMap, type LixInternalDatabaseSchema } from "./schema.js";
// import { applyOwnChangeControlTriggers } from "../own-change-control/database-triggers.js";
import { applyLogDatabaseSchema } from "../log/schema.js";
// import { applyKeyValueViewDatabaseSchema } from "../key-value/database-schema.js";
import { applyChangeDatabaseSchema } from "../change/schema.js";
import { applyChangeSetDatabaseSchema } from "../change-set-v2/schema.js";
import { applyVersionDatabaseSchema } from "../version/schema.js";
import { applySnapshotDatabaseSchema } from "../snapshot/schema.js";
import { applyStoredSchemaDatabaseSchema } from "../stored-schema/schema.js";
import { applyKeyValueDatabaseSchema } from "../key-value/schema.js";
import { applyStateDatabaseSchema } from "../state/schema.js";
import { applyChangeAuthorDatabaseSchema } from "../change-author/schema.js";
import { applyLabelDatabaseSchema } from "../label/schema.js";
import { applyThreadDatabaseSchema } from "../thread/schema.js";

/**
 * Applies the database schema to the given sqlite database.
 */
export function applySchema(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<LixInternalDatabaseSchema>;
}): SqliteWasmDatabase {
	applySnapshotDatabaseSchema(args.sqlite);
	applyChangeDatabaseSchema(args.sqlite);
	applyChangeSetDatabaseSchema(args.sqlite);
	applyStateDatabaseSchema(args.sqlite, args.db);
	applyStoredSchemaDatabaseSchema(args.sqlite);
	applyVersionDatabaseSchema(args.sqlite);
	applyKeyValueDatabaseSchema(args.sqlite);
	applyChangeAuthorDatabaseSchema(args.sqlite);
	applyLabelDatabaseSchema(args.sqlite);
	applyThreadDatabaseSchema(args.sqlite);
	// applyFileDatabaseSchema will be called later when lix is fully constructed
	applyLogDatabaseSchema(args.sqlite);

	// insert the schemas into the stored_schema table
	// to enable validation. must be done after the database
	// schemas have been applied to ensure that the stored_schema
	// table exists.
	for (const schema of Object.values(LixSchemaViewMap)) {
		args.sqlite.exec(
			`
			INSERT INTO stored_schema (value)
			SELECT ?
			WHERE NOT EXISTS (
				SELECT 1
				FROM stored_schema
				WHERE key = '${schema["x-lix-key"]}'
				AND version = '${schema["x-lix-version"]}'
			);
			`,
			{ bind: [JSON.stringify(schema)] }
		);
	}

	// // eslint-disable-next-line @typescript-eslint/no-unused-expressions
	// args.sqlite.exec`

	// PRAGMA foreign_keys = ON;
	// PRAGMA auto_vacuum = 2; -- incremental https://www.sqlite.org/pragma.html#pragma_auto_vacuum

	// CREATE TABLE IF NOT EXISTS change (
	//   id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
	//   entity_id TEXT NOT NULL,
	//   schema_key TEXT NOT NULL,
	//   file_id TEXT NOT NULL,
	//   plugin_key TEXT NOT NULL,
	//   snapshot_id TEXT NOT NULL,
	//   created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,

	//   UNIQUE (id, entity_id, file_id, schema_key),
	//   FOREIGN KEY(snapshot_id) REFERENCES snapshot(id)
	// ) STRICT;

	// CREATE TABLE IF NOT EXISTS change_author (
	//   change_id TEXT NOT NULL,
	//   account_id TEXT NOT NULL,

	//   PRIMARY KEY (change_id, account_id),
	//   FOREIGN KEY(change_id) REFERENCES change(id),
	//   FOREIGN KEY(account_id) REFERENCES account(id)
	// ) strict;
	// `;

	// applyChangeSetDatabaseSchema(args.sqlite);

	// args.sqlite.exec`

	// -- labels

	// CREATE TABLE IF NOT EXISTS label (
	//   id TEXT PRIMARY KEY DEFAULT (nano_id(8)),

	//   name TEXT NOT NULL UNIQUE  -- e.g., 'checkpoint', 'reviewed'

	// ) STRICT;

	// INSERT OR IGNORE INTO label (name) VALUES ('checkpoint');

	// CREATE TEMP TRIGGER IF NOT EXISTS insert_account_if_not_exists_on_change_author
	// BEFORE INSERT ON change_author
	// FOR EACH ROW
	// WHEN NEW.account_id NOT IN (SELECT id FROM account) AND NEW.account_id IN (SELECT id FROM temp.active_account)
	// BEGIN
	//   INSERT OR IGNORE INTO account
	//     SELECT
	//     *
	//     FROM active_account
	//     WHERE id = NEW.account_id;
	// END;
	// `;

	// applyFileQueueDatabaseSchema(args.sqlite);
	// applyChangeProposalDatabaseSchema(args.sqlite);
	// applyChangeSetEdgeDatabaseSchema(args.sqlite);
	// applyVersionV2DatabaseSchema(args.sqlite, args.db);
	// applyOwnChangeControlTriggers(args.sqlite, args.db);
	// applyLogDatabaseSchema(args.sqlite);

	// applyKeyValueViewDatabaseSchema(args.sqlite, args.db);

	return args.sqlite;
}
