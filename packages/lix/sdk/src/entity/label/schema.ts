import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../../schema-definition/definition.js";
import { createEntityViewsIfNotExists } from "../../entity-views/entity-view-builder.js";
import type { LixEngine } from "../../engine/boot.js";

export function applyEntityLabelDatabaseSchema(args: {
	engine: Pick<LixEngine, "sqlite">;
}): void {
	createEntityViewsIfNotExists({
		engine: args.engine,
		schema: LixEntityLabelSchema,
		overrideName: "entity_label",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
	});
}

export const LixEntityLabelSchema = {
	"x-lix-key": "lix_entity_label",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["entity_id", "schema_key", "file_id", "label_id"],
	"x-lix-foreign-keys": [
		{
			properties: ["entity_id", "schema_key", "file_id"],
			references: {
				schemaKey: "state",
				properties: ["entity_id", "schema_key", "file_id"],
			},
		},
		{
			properties: ["label_id"],
			references: {
				schemaKey: "lix_label",
				properties: ["id"],
			},
		},
	],
	type: "object",
	properties: {
		entity_id: { type: "string" },
		schema_key: { type: "string" },
		file_id: { type: "string" },
		label_id: { type: "string" },
	},
	required: ["entity_id", "schema_key", "file_id", "label_id"],
	additionalProperties: false,
} as const;
LixEntityLabelSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type LixEntityLabel = FromLixSchemaDefinition<
	typeof LixEntityLabelSchema
>;
