import type { Generated, Insertable, Selectable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixSchemaDefinition } from "../schema/definition.js";

export function applyVersionDatabaseSchema(sqlite: SqliteWasmDatabase): void {
	sqlite.exec(`
  -- version
  CREATE VIEW IF NOT EXISTS version AS
  SELECT
    json_extract(snapshot_content, '$.id') AS id,
    json_extract(snapshot_content, '$.name') AS name,
    json_extract(snapshot_content, '$.change_set_id') AS change_set_id
  FROM state
  WHERE schema_key = 'lix_version';

  CREATE TRIGGER version_insert
  INSTEAD OF INSERT ON version
  BEGIN
    INSERT INTO state (
      entity_id,
      schema_key,
      file_id,
      plugin_key,
      snapshot_content
    ) VALUES (
      NEW.id,
      'lix_version',
      'lix',
      'lix_own_entity',
      json_object('id', NEW.id, 'name', NEW.name, 'change_set_id', NEW.change_set_id)
    );
  END;

  CREATE TRIGGER version_update
  INSTEAD OF UPDATE ON version
  BEGIN
    UPDATE state
    SET
      entity_id = NEW.id,
      schema_key = 'lix_version',
      file_id = 'lix',
      plugin_key = 'lix_own_entity',
      snapshot_content = json_object('id', NEW.id, 'name', NEW.name, 'change_set_id', NEW.change_set_id)
    WHERE
      entity_id = OLD.id
      AND schema_key = 'lix_version'
      AND file_id = 'lix';
  END;

  CREATE TRIGGER version_delete
  INSTEAD OF DELETE ON version
  BEGIN
    DELETE FROM state
    WHERE entity_id = OLD.id
    AND schema_key = 'lix_version';
  END;

  -- active version 
  CREATE VIEW IF NOT EXISTS active_version AS 
  SELECT
    json_extract(snapshot_content, '$.version_id') AS version_id
  FROM state
  WHERE schema_key = 'lix_active_version';

  CREATE TRIGGER active_version_insert
  INSTEAD OF INSERT ON active_version
  BEGIN
    INSERT INTO state (
      entity_id,
      schema_key,
      file_id,
      plugin_key,
      snapshot_content
    ) VALUES (
      'lix_active_version',
      'lix_active_version',
      'lix',
      'lix_own_entity',
      json_object('version_id', NEW.version_id)
    );
  END;

  CREATE TRIGGER active_version_update
  INSTEAD OF UPDATE ON active_version
  BEGIN
    UPDATE state
    SET
      snapshot_content = json_object('version_id', NEW.version_id)
    WHERE
      entity_id = 'lix_active_version'
      AND schema_key = 'lix_active_version'
      AND file_id = 'lix';
  END;

  CREATE TRIGGER active_version_delete
  INSTEAD OF DELETE ON active_version
  BEGIN
    DELETE FROM state
    WHERE entity_id = 'lix_active_version'
    AND schema_key = 'lix_active_version';
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
