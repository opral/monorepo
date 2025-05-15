import { type Selectable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Insertable, Updateable } from "kysely";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import {
	JSONTypeSchema,
	type JSONType,
} from "../schema-definition/json-type.js";

export function applyKeyValueDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	return sqlite.exec`
	CREATE VIEW IF NOT EXISTS key_value AS
  SELECT
    json_extract(snapshot_content, '$.key') AS key,
    json_extract(snapshot_content, '$.value') AS value
  FROM state
  WHERE schema_key = 'lix_key_value';

	CREATE TRIGGER key_value_insert
	INSTEAD OF INSERT ON key_value
	BEGIN
		INSERT INTO state (
			entity_id,
			schema_key,
			file_id,
			plugin_key,
			snapshot_content
		) VALUES (
			NEW.key,
			'lix_key_value',
			'lix',
			'lix_own_entity',
			json_object('key', NEW.key, 'value', NEW.value)
		);
	END;

	CREATE TRIGGER key_value_update
	INSTEAD OF UPDATE ON key_value
	BEGIN
		UPDATE state
		SET
			entity_id = NEW.key,
			schema_key = 'lix_key_value',
			file_id = 'lix',
			plugin_key = 'lix_own_entity',
			snapshot_content = json_object('key', NEW.key, 'value', NEW.value)
		WHERE
			state.entity_id = OLD.key
			AND state.schema_key = 'lix_key_value'
			AND state.file_id = 'lix';
	END;

	CREATE TRIGGER key_value_delete
	INSTEAD OF DELETE ON key_value
	BEGIN
		DELETE FROM state
		WHERE entity_id = OLD.key
		AND schema_key = 'lix_key_value'
		AND file_id = 'lix';
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
		value: JSONTypeSchema as any,
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
