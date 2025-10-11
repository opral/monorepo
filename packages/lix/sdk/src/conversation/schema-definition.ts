import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../schema-definition/definition.js";
import { ZettelDocJsonSchema, type ZettelDoc } from "@opral/zettel-ast";

export type LixConversation = FromLixSchemaDefinition<
	typeof LixConversationSchema
>;

export const LixConversationSchema = {
	"x-lix-key": "lix_conversation",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	"x-lix-override-lixcols": {
		lixcol_file_id: '"lix"',
		lixcol_plugin_key: '"lix_own_entity"',
	},
	type: "object",
	properties: {
		id: {
			type: "string",
			"x-lix-default": "lix_uuid_v7()",
		},
	},
	required: ["id"],
	additionalProperties: false,
} as const;
LixConversationSchema satisfies LixSchemaDefinition;

export type LixConversationMessage = FromLixSchemaDefinition<
	typeof LixConversationMessageSchema
> & {
	body: ZettelDoc;
};

export const LixConversationMessageSchema = {
	"x-lix-key": "lix_conversation_message",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	"x-lix-override-lixcols": {
		lixcol_file_id: '"lix"',
		lixcol_plugin_key: '"lix_own_entity"',
	},
	"x-lix-foreign-keys": [
		{
			properties: ["/conversation_id"],
			references: {
				schemaKey: "lix_conversation",
				properties: ["/id"],
			},
		},
		{
			properties: ["/parent_id"],
			references: {
				schemaKey: "lix_conversation_message",
				properties: ["/id"],
			},
		},
	],
	type: "object",
	properties: {
		id: {
			type: "string",
			"x-lix-default": "lix_uuid_v7()",
		},
		conversation_id: { type: "string" },
		parent_id: { type: "string", nullable: true },
		body: ZettelDocJsonSchema as any,
	},
	required: ["id", "conversation_id", "body"],
	additionalProperties: false,
} as const;
LixConversationMessageSchema satisfies LixSchemaDefinition;
