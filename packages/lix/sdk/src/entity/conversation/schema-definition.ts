import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../../schema-definition/definition.js";

export type LixEntityConversation = FromLixSchemaDefinition<
	typeof LixEntityConversationSchema
>;

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
