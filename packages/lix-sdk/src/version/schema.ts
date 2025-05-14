import type { Generated, Insertable, Selectable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixSchemaDefinition } from "../schema/definition.js";

export function applyVersionDatabaseSchema(sqlite: SqliteWasmDatabase): void {
	sqlite.exec(`
  -- version
  CREATE VIEW IF NOT EXISTS version AS
  SELECT
    json_extract(row, '$.id') AS id,
    json_extract(row, '$.name') AS name,
    json_extract(row, '$.change_set_id') AS change_set_id
  FROM (
    SELECT handle_select_on_view('version', 'id', v.id) AS row
    FROM (
      SELECT entity_id AS id
      FROM internal_change
      WHERE schema_key = 'lix_version'
        AND rowid IN (
          SELECT MAX(rowid)
          FROM internal_change
          WHERE schema_key = 'lix_version'
          GROUP BY entity_id
        )
        AND snapshot_id != 'no-content'
    ) v
  );

  CREATE TRIGGER version_insert
  INSTEAD OF INSERT ON version
  BEGIN
      SELECT handle_insert_on_view('version', 
        'id', COALESCE(NEW.id, uuid_v7()),
        'name', NEW.name,
        'change_set_id', NEW.change_set_id
      );
  END;

  CREATE TRIGGER version_update
  INSTEAD OF UPDATE ON version
  BEGIN
      SELECT handle_update_on_view('version', 
        'id', OLD.id,
        'name', NEW.name,
        'change_set_id', NEW.change_set_id
      );
  END;

  CREATE TRIGGER version_delete
  INSTEAD OF DELETE ON version
  BEGIN
      SELECT handle_delete_on_view('version', 
        'id', OLD.id
      );
  END;

  -- active version 
  CREATE VIEW IF NOT EXISTS active_version AS 
  SELECT
    json_extract(row, '$.version_id') AS version_id
  FROM (
    SELECT handle_select_on_view('active_version', 'version_id', v.id) AS row
    FROM (
      SELECT entity_id AS id
      FROM internal_change
      WHERE schema_key = 'lix_active_version'
        AND rowid IN (
          SELECT MAX(rowid)
          FROM internal_change
          WHERE schema_key = 'lix_active_version'
          GROUP BY entity_id
        )
        AND snapshot_id != 'no-content'
    ) v
  );

  CREATE TRIGGER active_version_insert
  INSTEAD OF INSERT ON active_version
  BEGIN
    SELECT handle_insert_on_view(
      'active_version', 
      'version_id', NEW.version_id
    );
  END;

  CREATE TRIGGER active_version_update
  INSTEAD OF UPDATE ON active_version
  BEGIN
    SELECT handle_update_on_view(
      'active_version', 
      'version_id', NEW.version_id
    );
  END;

  CREATE TRIGGER active_version_delete
  INSTEAD OF DELETE ON active_version
  BEGIN
    SELECT handle_delete_on_view(
      'active_version', 
      'version_id', OLD.version_id
    );
  END;

`);
}

export const VersionSchema = {
	"x-lix-key": "lix_version",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	type: "object",
	properties: {
		id: { type: "string" },
		name: { type: "string" },
		change_set_id: { type: "string" },
	},
	required: ["id", "name", "change_set_id"],
} as const;
VersionSchema satisfies LixSchemaDefinition;

export type Version = Selectable<VersionView>;
export type NewVersion = Insertable<VersionView>;
export type VersionView = {
	id: Generated<string>;
	name: string;
	change_set_id: string;
};

export const ActiveVersionSchema = {
	"x-lix-key": "lix_active_version",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["version_id"],
	type: "object",
	properties: {
		version_id: { type: "string" },
	},
	required: ["version_id"],
} as const;
ActiveVersionSchema satisfies LixSchemaDefinition;

export type ActiveVersion = Selectable<ActiveVersionView>;
export type NewActiveVersion = Insertable<ActiveVersionView>;
export type ActiveVersionView = {
	version_id: Generated<string>;
};
