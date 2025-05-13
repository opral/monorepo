import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixSchemaDefinition } from "./definition.js";
import type { Selectable, Insertable, Updateable, Generated } from "kysely";

export function applyStoredSchemaDatabaseSchema(
	sqlite: SqliteWasmDatabase
): void {
	sqlite.exec(`
  CREATE VIEW IF NOT EXISTS stored_schema AS
  SELECT
    json_extract(row, '$.key') AS key,
    json_extract(row, '$.version') AS version,
    json_extract(row, '$.value') AS value
  FROM (
    SELECT handle_select_on_view('stored_schema', 'key', v.key, 'version', v.version) AS row
    FROM (
      SELECT
        json_extract(entity_id, '$[0]') AS key,
        json_extract(entity_id, '$[1]') AS version
      FROM internal_change
      WHERE schema_key = 'lix_stored_schema'
        AND rowid IN (
          SELECT MAX(rowid)
          FROM internal_change
          WHERE schema_key = 'lix_stored_schema'
          GROUP BY entity_id
        )
        AND snapshot_id != 'no-content'
    ) v
  );

  CREATE TRIGGER IF NOT EXISTS stored_schema_insert
  INSTEAD OF INSERT ON stored_schema
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
      SELECT handle_insert_on_view('stored_schema', 
        'key', json_extract(NEW.value, '$.x-lix-key'),
        'version', json_extract(NEW.value, '$.x-lix-version'),
        'value', NEW.value
      );
  END;

  CREATE TRIGGER IF NOT EXISTS stored_schema_delete
  INSTEAD OF DELETE ON stored_schema
  BEGIN
      SELECT handle_delete_on_view('stored_schema', 
        'key', OLD.key,
        'version', OLD.version
      );
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
		value: { type: "object" },
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
