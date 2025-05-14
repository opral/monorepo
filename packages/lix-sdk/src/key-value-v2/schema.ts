import { type Selectable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Insertable, Updateable } from "kysely";
import type { LixSchemaDefinition } from "../schema/definition.js";
import { JSONTypeSchema, type JSONType } from "../schema/json-type.js";

export function applyKeyValueDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	return sqlite.exec`
	CREATE VIEW IF NOT EXISTS key_value AS
  SELECT
    json_extract(row, '$.key') AS key,
    json_extract(row, '$.value') AS value
  FROM (
    SELECT handle_select_on_view('key_value', 'key', v.key) AS row
    FROM (
      SELECT entity_id AS key
      FROM internal_change
      WHERE schema_key = 'lix_key_value'
        AND rowid IN (
          SELECT MAX(rowid)
          FROM internal_change
          WHERE schema_key = 'lix_key_value'
          GROUP BY entity_id
        )
        AND snapshot_id != 'no-content'
    ) v
  );

	CREATE TRIGGER key_value_insert
	INSTEAD OF INSERT ON key_value
	BEGIN
		SELECT handle_insert_on_view(
		  'key_value', 
			'key', NEW.key, 
			'value', NEW.value
		);
	END;

	CREATE TRIGGER key_value_update
	INSTEAD OF UPDATE ON key_value
	BEGIN
		SELECT handle_update_on_view(
		  'key_value', 
			'key', NEW.key, 
			'value', NEW.value
		);
	END;

	CREATE TRIGGER key_value_delete
	INSTEAD OF DELETE ON key_value
	BEGIN
		SELECT handle_delete_on_view(
		  'key_value', 
			'key', OLD.key
		);
	END;
`;
}

export const KeyValueSchema = {
	"x-lix-key": "lix_key_value",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["key"],
	type: "object",
	properties: {
		key: { type: "string" },
		value: JSONTypeSchema,
	},
	required: ["key", "value"],
} as const;
KeyValueSchema satisfies LixSchemaDefinition;

export type KeyValue = Selectable<KeyValueView>;
export type NewKeyValue = Insertable<KeyValueView>;
export type KeyValueUpdate = Updateable<KeyValueView>;
export type KeyValueView = {
	key: string;
	value: JSONType;
};

type PredefinedKeys =
	| "lix_id"
	| "lix_server_url"
	| "lix_sync"
	| "lix_log_levels";
// The string & {} ensures TypeScript recognizes KeyValueKeys
// as a superset of string, preventing conflicts when using other string values.
type KeyType = string & {};
type KeyValueKeys = PredefinedKeys | KeyType;
