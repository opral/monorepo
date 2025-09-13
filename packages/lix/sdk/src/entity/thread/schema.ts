import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../../schema-definition/definition.js";
import { createEntityViewsIfNotExists } from "../../entity-views/entity-view-builder.js";
import type { LixEngine } from "../../engine/boot.js";

export function applyEntityThreadDatabaseSchema(args: {
	engine: Pick<LixEngine, "sqlite">;
}): void {
	createEntityViewsIfNotExists({
		engine: args.engine,
		schema: LixEntityThreadSchema,
		overrideName: "entity_thread",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
	});
}

export const LixEntityThreadSchema = {
	"x-lix-key": "lix_entity_thread",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["entity_id", "schema_key", "file_id", "thread_id"],
	"x-lix-foreign-keys": [
		{
			properties: ["entity_id", "schema_key", "file_id"],
			references: {
				schemaKey: "state",
				properties: ["entity_id", "schema_key", "file_id"],
			},
		},
		{
			properties: ["thread_id"],
			references: {
				schemaKey: "lix_thread",
				properties: ["id"],
			},
		},
	],
	type: "object",
	properties: {
		entity_id: { type: "string" },
		schema_key: { type: "string" },
		file_id: { type: "string" },
		thread_id: { type: "string" },
	},
	required: ["entity_id", "schema_key", "file_id", "thread_id"],
	additionalProperties: false,
} as const;
LixEntityThreadSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type LixEntityThread = FromLixSchemaDefinition<
	typeof LixEntityThreadSchema
>;
