import { validateFilePath } from "./validate-file-path.js";
import {
	Kysely,
	ParseJSONResultsPlugin,
	type Generated,
	type Insertable,
	type Selectable,
	type Updateable,
} from "kysely";
import { createDialect, createInMemoryDatabase } from "sqlite-wasm-kysely";
import type { SnapshotTable } from "../snapshot/database-schema.js";
import { v7 } from "uuid";

export async function initPrototypeDb(): Promise<Kysely<DatabaseSchema>> {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = new Kysely<DatabaseSchema>({
		dialect: createDialect({
			database: sqlite,
		}),
		plugins: [new ParseJSONResultsPlugin()],
	});

	sqlite.createFunction({
		name: "uuid_v7",
		arity: 0,
		xFunc: () => {
			return v7();
		},
	});

	sqlite.createFunction({
		name: "is_valid_file_path",
		arity: 1,
		// @ts-expect-error - sqlite-wasm-kysely types are not correct
		xFunc: (_ctx: number, value: string) => {
			return validateFilePath(value) as unknown as string;
		},
		deterministic: true,
	});

	sqlite.exec(`
  PRAGMA foreign_keys = ON;

	CREATE TABLE IF NOT EXISTS snapshot (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    content TEXT
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


  CREATE TABLE IF NOT EXISTS file_materialized (
    id TEXT,
    path TEXT NOT NULL,
    data TEXT NOT NULL,
    metadata TEXT,

		change_set_id TEXT NOT NULL,

		PRIMARY KEY (id, change_set_id),
		UNIQUE (path, change_set_id),
    CHECK (is_valid_file_path(path))
  ) STRICT;

  CREATE TABLE IF NOT EXISTS version_materialized (
    name TEXT PRIMARY KEY,
    change_set_id TEXT NOT NULL
  ) STRICT;

  CREATE VIEW IF NOT EXISTS version AS
  WITH RankedSnapshots AS (
      SELECT
          ch.entity_id AS name,
          json_extract(s.content, '$.change_set_id') AS change_set_id,
          s.content IS NULL AS is_deleted,
          ROW_NUMBER() OVER (
              PARTITION BY ch.entity_id
              ORDER BY ch.created_at DESC, ch.id DESC
          ) as rn
      FROM
          Change AS ch
      JOIN
          Snapshot AS s ON ch.snapshot_id = s.id
      WHERE
          ch.schema_key = 'lix_version_view_table'
  )
  SELECT
      name,
      change_set_id
  FROM
      RankedSnapshots
  WHERE
      rn = 1 AND is_deleted = 0;

	INSERT INTO snapshot (id, content)
	VALUES ('no-content', NULL);

  CREATE TRIGGER version_insert
  INSTEAD OF INSERT ON version
  BEGIN
      INSERT INTO snapshot (content)
      VALUES (json_object('name', NEW.name, 'change_set_id', NEW.change_set_id));

      INSERT INTO change (entity_id, schema_key, snapshot_id, file_id, plugin_key)
      VALUES (
          NEW.name,
          'lix_version_view_table',
          (SELECT id FROM snapshot ORDER BY rowid DESC LIMIT 1),
          'lix_own_change_control',
          'lix_own_change_control'
      );
  END;

  CREATE TRIGGER version_update
  INSTEAD OF UPDATE ON version
  BEGIN
      INSERT INTO snapshot (content)
      VALUES (json_object('name', NEW.name, 'change_set_id', NEW.change_set_id));

      INSERT INTO change (entity_id, schema_key, snapshot_id, file_id, plugin_key)
      VALUES (
          NEW.name, 
          'lix_version_view_table',
          (SELECT id FROM snapshot ORDER BY rowid DESC LIMIT 1),
          'lix_own_change_control',
          'lix_own_change_control'
      );
  END;

  CREATE TRIGGER version_delete
  INSTEAD OF DELETE ON version
  BEGIN
      INSERT INTO change (entity_id, schema_key, snapshot_id, file_id, plugin_key)
      VALUES (
          OLD.name, 
          'lix_version_view_table',
          'no-content',
          'lix_own_change_control',
          'lix_own_change_control'
      );
  END;

`);
	return db;
}

type DatabaseSchema = {
	file: LixFileTable;
	change: ChangeTable;
	snapshot: SnapshotTable;
	version: VersionView;
};

export type Change = Selectable<ChangeTable>;
export type NewChange = Insertable<ChangeTable>;
type ChangeTable = {
	id: Generated<string>;
	/**
	 * The entity the change refers to.
	 */
	entity_id: string;
	file_id: string;
	/**
	 * The plugin key that contributed the change.
	 *
	 * Exists to ease querying for changes by plugin,
	 * in case the user changes the plugin configuration.
	 */
	plugin_key: string;
	/**
	 * The schema key that the change refers to.
	 */
	schema_key: string;
	snapshot_id: string;
	/**
	 * The time the change was created.
	 */
	created_at: Generated<string>;
};

// named lix file to avoid conflict with built-in file type
export type LixFile = Selectable<LixFileTable>;
export type NewLixFile = Insertable<LixFileTable>;
export type LixFileUpdate = Updateable<LixFileTable>;
export type LixFileTable = {
	id: Generated<string>;
	/**
	 * The path of the file.
	 *
	 * The path is currently defined as a subset of RFC 3986.
	 * Any path can be tested with the `isValidFilePath()` function.
	 *
	 * @example
	 *   - `/path/to/file.txt`
	 */
	path: string;
	data: Uint8Array;
	version_id: string;
	metadata: Record<string, any> | null;
};

export type Version = Selectable<VersionView>;
export type NewVersion = Insertable<VersionView>;
export type VersionView = {
	name: string;
	change_set_id: string;
};
