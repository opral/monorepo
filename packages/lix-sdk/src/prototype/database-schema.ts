import { validateFilePath } from "./validate-file-path.js";
import {
	Kysely,
	ParseJSONResultsPlugin,
	type Generated,
	type Insertable,
	type Selectable,
} from "kysely";
import { createDialect, createInMemoryDatabase } from "sqlite-wasm-kysely";
import type { SnapshotTable } from "../snapshot/database-schema.js";
import { v7 } from "uuid";
import { getAndMaterializeRow } from "./get-and-materialize-row.js";
import {
	applyFileSchema,
	type FileMaterializedTable,
	type LixFileTable,
} from "./file-schema.js";
import {
	applyVersionSchema,
	type VersionMaterializedTable,
	type VersionView,
} from "./version-schema.js";

export async function initPrototypeDb(): Promise<Kysely<DatabaseSchema>> {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = new Kysely<InternalDatabaseSchema>({
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

	sqlite.createFunction({
		name: "get_and_materialize_row",
		arity: -1,
		// potentially writes to the database
		deterministic: false,
		xFunc: (_ctx: number, ...args: any[]) => {
			return getAndMaterializeRow(sqlite, db, ...args);
		},
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

  INSERT INTO snapshot (id, content)
	VALUES ('no-content', NULL);

`);
	applyFileSchema(sqlite, db);
	applyVersionSchema(sqlite);
	return db as unknown as Kysely<DatabaseSchema>;
}

export type InternalDatabaseSchema = DatabaseSchema & {
	file_materialized: FileMaterializedTable;
	version_materialized: VersionMaterializedTable;
};

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

