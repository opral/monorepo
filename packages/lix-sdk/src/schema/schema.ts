import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixSchemaDefinition } from "./definition.js";
import type { Selectable, Insertable, Updateable, Generated } from "kysely";
import { JSONTypeSchema } from "./json-type.js";

export function applyStoredSchemaDatabaseSchema(
	sqlite: SqliteWasmDatabase
): void {
	sqlite.exec(`
  CREATE VIEW IF NOT EXISTS stored_schema AS
  SELECT
    json_extract(snapshot_content, '$.key') AS key,
    json_extract(snapshot_content, '$.version') AS version,
    json_extract(snapshot_content, '$.value') AS value
  FROM state
  WHERE schema_key = 'lix_stored_schema';

  CREATE TRIGGER IF NOT EXISTS stored_schema_insert
  INSTEAD OF INSERT ON stored_schema
  BEGIN
    INSERT INTO state (
      entity_id,
      schema_key,
      file_id,
      plugin_key,
      snapshot_content
      ) VALUES (
      NEW.key || '::' || NEW.version, 
      'lix_stored_schema',
      'lix',
      'lix_own_entity',
      json_object(
        'key', NEW.key, 
        'version', NEW.version, 
        'value', NEW.value
      )
    );
  END;

  CREATE TRIGGER IF NOT EXISTS stored_schema_delete
  INSTEAD OF DELETE ON stored_schema
  BEGIN
      DELETE FROM state WHERE entity_id = OLD.key || '::' || OLD.version AND schema_key = 'lix_stored_schema';
  END;
`);
}

export const StoredSchemaSchema = {
	"x-lix-key": "lix_stored_schema",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["key", "version"],
	type: "object",
	properties: {
		key: { type: "string" },
		version: { type: "string" },
		value: JSONTypeSchema,
	},
	additionalProperties: false,
} as const;

StoredSchemaSchema satisfies LixSchemaDefinition;

export type StoredSchema = Selectable<StoredSchemaView>;
export type NewStoredSchema = Insertable<StoredSchemaView>;
export type StoredSchemaUpdate = Updateable<StoredSchemaView>;
export type StoredSchemaView = {
	key: Generated<string>;
	version: Generated<string>;
	value: LixSchemaDefinition;
};
