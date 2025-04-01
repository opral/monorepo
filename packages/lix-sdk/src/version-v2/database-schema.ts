import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export function applyVersionV2DatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	const sql = `
  CREATE TABLE IF NOT EXISTS version_v2 (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    name TEXT UNIQUE DEFAULT (human_id()),
    change_set_id TEXT NOT NULL,

    FOREIGN KEY(change_set_id) REFERENCES change_set(id)
  ) STRICT;

  -- only one version can be active at a time
  -- hence, the table has only one row
  CREATE TABLE IF NOT EXISTS active_version (
    id TEXT NOT NULL PRIMARY KEY,

    FOREIGN KEY(id) REFERENCES version_v2(id)
  ) STRICT;

  -- Insert the default change set if missing
  -- (this is a workaround for not having a separate creation and migration schema's)
  INSERT INTO change_set (id)
  SELECT 'initialchangeset'
  WHERE NOT EXISTS (SELECT 1 FROM change_set WHERE id = 'initialchangeset');

  -- Insert the default version if missing
  -- (this is a workaround for not having a separate creation and migration schema's)
  INSERT INTO version_v2 (id, name, change_set_id)
  SELECT '019328cc-ccb0-7f51-96e8-524df4597ac6', 'main', 'initialchangeset'
  WHERE NOT EXISTS (SELECT 1 FROM version_v2);

  -- Set the default current version to 'main' if both tables are empty
  -- (this is a workaround for not having a separata creation and migration schema's)
  INSERT INTO active_version (id)
  SELECT '019328cc-ccb0-7f51-96e8-524df4597ac6'
  WHERE NOT EXISTS (SELECT 1 FROM active_version);
`;

	return sqlite.exec(sql);
}

export type VersionV2 = Selectable<VersionV2Table>;
export type NewVersionV2 = Insertable<VersionV2Table>;
export type VersionV2Update = Updateable<VersionV2Table>;
export type VersionV2Table = {
	id: Generated<string>;
	name: string | null;
	change_set_id: string;
};

export type ActiveVersion = Selectable<ActiveVersionTable>;
export type NewActiveVersion = Insertable<ActiveVersionTable>;
export type ActiveVersionUpdate = Updateable<ActiveVersionTable>;
export type ActiveVersionTable = {
	id: Generated<string>;
};
