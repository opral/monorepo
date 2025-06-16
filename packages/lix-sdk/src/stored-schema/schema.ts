import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import type { Selectable, Insertable, Updateable, Generated } from "kysely";
import { JSONTypeSchema } from "../schema-definition/json-type.js";

export function applyStoredSchemaDatabaseSchema(
	sqlite: SqliteWasmDatabase
): void {
	sqlite.exec(`
  CREATE VIEW IF NOT EXISTS stored_schema AS
  SELECT
    json_extract(snapshot_content, '$.value.x-lix-key') AS key,
    json_extract(snapshot_content, '$.value.x-lix-version') AS version,
    json_extract(snapshot_content, '$.value') AS value,
    version_id AS state_version_id,
    inherited_from_version_id AS state_inherited_from_version_id
  FROM state
  WHERE schema_key = 'lix_stored_schema';

  CREATE TRIGGER IF NOT EXISTS stored_schema_insert
  INSTEAD OF INSERT ON stored_schema
  FOR EACH ROW
  BEGIN 
    -- Check x-lix-key if present
    SELECT CASE
      WHEN NEW.key IS NOT NULL
        AND NEW.key IS NOT json_extract(NEW.value, '$.x-lix-key')
      THEN RAISE(FAIL, 'Inserted key does not match value.x-lix-key: key=' || NEW.key || ' x-lix-key=' || json_extract(NEW.value, '$.x-lix-key'))
    END;
    -- Check x-lix-version if present
    SELECT CASE
      WHEN NEW.version IS NOT NULL
        AND NEW.version IS NOT json_extract(NEW.value, '$.x-lix-version')
      THEN RAISE(FAIL, 'Inserted version does not match value.x-lix-version: version=' || NEW.version || ' x-lix-version=' || json_extract(NEW.value, '$.x-lix-version'))
    END;
    -- Proceed with insert
    INSERT INTO state (
      entity_id,
      schema_key,
      file_id,
      plugin_key,
      snapshot_content,
      schema_version,
      version_id
      ) VALUES (
      json_extract(NEW.value, '$.x-lix-key') || '::' || json_extract(NEW.value, '$.x-lix-version'), 
      'lix_stored_schema',
      'lix',
      'lix_own_entity',
      json_object(
        'key', json_extract(NEW.value, '$.x-lix-key'), 
        'version', json_extract(NEW.value, '$.x-lix-version'), 
        'value', json(NEW.value)
      ),
      '${LixStoredSchemaSchema["x-lix-version"]}',
      COALESCE(NEW.state_version_id, (SELECT version_id FROM active_version))
    );
  END;

  CREATE TRIGGER IF NOT EXISTS stored_schema_delete
  INSTEAD OF DELETE ON stored_schema
  BEGIN
      DELETE FROM state 
      WHERE entity_id = OLD.key || '::' || OLD.version 
      AND schema_key = 'lix_stored_schema';
  END;
`);
}

export const LixStoredSchemaSchema = {
	"x-lix-key": "lix_stored_schema",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["key", "version"],
	type: "object",
	properties: {
		key: { type: "string" },
		version: { type: "string" },
		value: JSONTypeSchema as any,
	},
	additionalProperties: false,
} as const;

LixStoredSchemaSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type LixStoredSchema = FromLixSchemaDefinition<typeof LixStoredSchemaSchema>;

// Database view type (includes operational columns)
export type StoredSchemaView = {
	key: Generated<string>;
	version: Generated<string>;
	state_version_id: Generated<string>;
	state_inherited_from_version_id: Generated<string | null>;
	value: LixSchemaDefinition;
};

// Kysely operation types
export type StoredSchema = Selectable<StoredSchemaView>;
export type NewStoredSchema = Insertable<StoredSchemaView>;
export type StoredSchemaUpdate = Updateable<StoredSchemaView>;
