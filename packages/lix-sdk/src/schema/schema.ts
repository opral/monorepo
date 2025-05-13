import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixSchemaDefinition } from "./definition.js";
import type { Selectable, Insertable, Updateable, Generated } from "kysely";

export function applyStoredSchemaDatabaseSchema(
	sqlite: SqliteWasmDatabase
): void {
	sqlite.exec(`
  CREATE VIEW IF NOT EXISTS stored_schema AS
  SELECT
    json_extract(vj, '$.x-lix-key') AS key,
    json_extract(vj, '$.x-lix-version') AS version,
    vj as value
  FROM (
    SELECT handle_select_on_view('stored_schema', 'key', v.key) AS vj
    FROM (
      SELECT entity_id AS key
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
      SELECT handle_insert_on_view('stored_schema', 
        'key', json_extract(NEW.value, '$.x-lix-key'),
        'version', json_extract(NEW.value, '$.x-lix-version'),
        'value', NEW.value
      );
  END;

  CREATE TRIGGER IF NOT EXISTS stored_schema_update
  INSTEAD OF UPDATE ON stored_schema
  BEGIN
      SELECT handle_update_on_view('stored_schema', 
        'key', OLD.key,
        'version', NEW.version,
        'value', NEW.value
      );
  END;

  CREATE TRIGGER IF NOT EXISTS stored_schema_delete
  INSTEAD OF DELETE ON stored_schema
  BEGIN
      SELECT handle_delete_on_view('stored_schema', 
        'key', OLD.key
      );
  END;
`);
}

export const StoredSchemaSchema = {
	"x-lix-key": "lix_stored_schema",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["x-lix-key", "x-lix-version"],
	type: "object",
	properties: {
		"x-lix-key": { type: "string" },
		"x-lix-version": { type: "string" },
	},
	// Allo props for the dynamic lix schema
	additionalProperties: true,
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
