import { type Selectable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Insertable, Updateable } from "kysely";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { JSONTypeSchema } from "../schema-definition/json-type.js";
import type { StateEntityView } from "../state/entity-view-builder.js";
import { createEntityViewsIfNotExists } from "../state/entity-view-builder.js";

export function applyKeyValueDatabaseSchema(sqlite: SqliteWasmDatabase): void {
	return createEntityViewsIfNotExists({
		lix: { sqlite },
		schema: LixKeyValueSchema,
		overrideName: "key_value",
		pluginKey: "lix_key_value",
		hardcodedFileId: "lix",
	});
}

export const LixKeyValueSchema = {
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
LixKeyValueSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type LixKeyValue = FromLixSchemaDefinition<typeof LixKeyValueSchema>;

// Database view type (includes operational columns)
export type KeyValueView = {
	/**
	 * The key of the key-value pair.
	 *
	 * Lix prefixes its keys with "lix_" to avoid conflicts with user-defined keys.
	 * Provides autocomplete for predefined keys while allowing custom keys.
	 *
	 * @example
	 *   "lix_id"
	 *   "lix_sync"
	 *   "namespace_cool_key"
	 */
	key: KeyValueKeys;
	value: any; // JSONType, can be any valid JSON value
} & StateEntityView;

// Kysely operation types
export type KeyValue = Selectable<KeyValueView>;
export type NewKeyValue = Insertable<KeyValueView>;
export type KeyValueUpdate = Updateable<KeyValueView>;

type PredefinedKeys =
	| "lix_id"
	| "lix_server_url"
	| "lix_sync"
	| "lix_log_levels";
// The string & {} ensures TypeScript recognizes KeyValueKeys
// as a superset of string, preventing conflicts when using other string values.
type KeyType = string & {};
type KeyValueKeys = PredefinedKeys | KeyType;
