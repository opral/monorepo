import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../../schema-definition/definition.js";
import { createEntityViewsIfNotExists } from "../../entity-views/entity-view-builder.js";
import type { LixEngine } from "../../engine/boot.js";

export function applyEntityConversationDatabaseSchema(args: {
	engine: Pick<LixEngine, "sqlite">;
}): void {
	createEntityViewsIfNotExists({
		engine: args.engine,
		schema: LixEntityConversationSchema,
		// Create views matching the schema/view name used across the codebase
		// e.g. entity_conversation, entity_conversation_all, entity_conversation_history
		overrideName: "entity_conversation",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
	});
}

export const LixEntityConversationSchema = {
	"x-lix-key": "lix_entity_conversation",
	"x-lix-version": "1.0",
	"x-lix-primary-key": [
		"entity_id",
		"schema_key",
		"file_id",
		"conversation_id",
	],
	"x-lix-foreign-keys": [
		{
			properties: ["entity_id", "schema_key", "file_id"],
			references: {
				schemaKey: "state",
				properties: ["entity_id", "schema_key", "file_id"],
			},
		},
		{
			properties: ["conversation_id"],
			references: {
				schemaKey: "lix_conversation",
				properties: ["id"],
			},
		},
	],
	type: "object",
	properties: {
		entity_id: { type: "string" },
		schema_key: { type: "string" },
		file_id: { type: "string" },
		conversation_id: { type: "string" },
	},
	required: ["entity_id", "schema_key", "file_id", "conversation_id"],
	additionalProperties: false,
} as const;
LixEntityConversationSchema satisfies LixSchemaDefinition;

export type LixEntityConversation = FromLixSchemaDefinition<
	typeof LixEntityConversationSchema
>;
