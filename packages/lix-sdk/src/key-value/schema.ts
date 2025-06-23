import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { JSONTypeSchema } from "../schema-definition/json-type.js";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import type {
	EntityStateView,
	EntityStateAllView,
	EntityStateHistoryView,
	ToKysely,
} from "../entity-views/generic-types.js";

export function applyKeyValueDatabaseSchema(sqlite: SqliteWasmDatabase): void {
	return createEntityViewsIfNotExists({
		lix: { sqlite },
		schema: LixKeyValueSchema,
		overrideName: "key_value",
		pluginKey: "lix_own_entity",
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
	additionalProperties: false,
} as const;
LixKeyValueSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type LixKeyValue = FromLixSchemaDefinition<typeof LixKeyValueSchema> & {
	// override the value to any to allow any JSON type (instead of unknown which is annoying)
	value: any;
};

export type KeyValueView = ToKysely<EntityStateView<LixKeyValue>> & {
	// override the value to any to allow any JSON type (instead of unknown which is annoying)
	value: any;
};
export type KeyValueAllView = ToKysely<EntityStateAllView<LixKeyValue>>;
export type KeyValueHistoryView = ToKysely<EntityStateHistoryView<LixKeyValue>>;

