import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../schema-definition/definition.js";
import { JSONTypeSchema } from "../schema-definition/json-type.js";

/**
 * Represents a key-value pair in Lix.
 *
 * The value can be any JSON-serializable type (string, number, boolean, object, array, null).
 *
 * **Important SQLite Limitation with Boolean Values:**
 * SQLite does not have a native boolean type. When storing JSON values:
 * - `true` is stored as `1`
 * - `false` is stored as `0`
 *
 * This is a fundamental limitation of SQLite's JSON implementation. There is no way
 * to distinguish between a boolean `true` and the number `1` after retrieval.
 *
 * When querying boolean values, use loose equality (`==`) or handle the numeric representation.
 *
 * @example
 * ```typescript
 * await lix.db.insertInto("key_value").values({
 *   key: "lix_sync_enabled",
 *   value: true // Will be stored as 1 in SQLite
 * }).execute();
 *
 * await lix.db.insertInto("key_value").values({
 *   key: "lix_server_url",
 *   value: "https://api.example.com"
 * }).execute();
 * ```
 *
 * @example
 * ```typescript
 * const result = await lix.db
 *   .selectFrom("key_value")
 *   .where("key", "=", "lix_sync_enabled")
 *   .select("value")
 *   .executeTakeFirst();
 *
 * // result.value will be 1 (not true)
 * const isEnabled = result?.value == true; // Use loose equality
 * const isEnabled = result?.value === 1; // Or compare numeric value
 * ```
 *
 * @example
 * ```typescript
 * // Common Lix system keys
 * // "lix_id" - Unique identifier for the Lix instance
 * // "lix_name" - Human-readable name for the Lix instance
 * // "lix_server_url" - URL of the sync server
 * // "lix_deterministic_mode" - Boolean flag for deterministic ID generation
 * // "lix_telemetry" - Telemetry setting ("on" or "off")
 * ```
 */
export type LixKeyValue = FromLixSchemaDefinition<typeof LixKeyValueSchema> & {
	value: any;
};

export const LixKeyValueSchema = {
	"x-lix-key": "lix_key_value",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/key"],
	"x-lix-defaults": {
		lixcol_file_id: "lix",
		lixcol_plugin_key: "lix_own_entity",
	},
	type: "object",
	properties: {
		key: { type: "string" },
		value: JSONTypeSchema as any,
	},
	required: ["key", "value"],
	additionalProperties: false,
} as const;
LixKeyValueSchema satisfies LixSchemaDefinition;
