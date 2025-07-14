import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { JSONTypeSchema } from "../schema-definition/json-type.js";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";

export function applyKeyValueDatabaseSchema(sqlite: SqliteWasmDatabase): void {
	return createEntityViewsIfNotExists({
		lix: { sqlite },
		schema: LixKeyValueSchema,
		overrideName: "key_value",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
	});
}

/**
 * Schema definition for key-value pairs in Lix.
 * 
 * Key-value pairs provide a flexible storage mechanism for configuration,
 * settings, and metadata within a Lix instance.
 */
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
	additionalProperties: false,
} as const;
LixKeyValueSchema satisfies LixSchemaDefinition;

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
 * // Inserting key-value pairs
 * await lix.db.insertInto("key_value").values({
 *   key: "lix_sync_enabled",
 *   value: true  // Will be stored as 1 in SQLite
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
 * // Querying boolean values
 * const result = await lix.db
 *   .selectFrom("key_value")
 *   .where("key", "=", "lix_sync_enabled")
 *   .select("value")
 *   .executeTakeFirst();
 * 
 * // result.value will be 1 (not true)
 * const isEnabled = result?.value == true; // Use loose equality
 * // or
 * const isEnabled = result?.value === 1; // Check for numeric value
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
	// override the value to any to allow any JSON type (instead of unknown which is annoying)
	value: any;
};
