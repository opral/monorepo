import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { ZettelDocJsonSchema, type ZettelDoc } from "@opral/zettel-ast";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import { nanoIdSync } from "../engine/deterministic/index.js";
import type { LixEngine } from "../engine/boot.js";

export function applyConversationDatabaseSchema(args: {
	engine: Pick<LixEngine, "sqlite" | "db" | "hooks">;
}): void {
	// Create both primary and _all views for conversation with default ID generation
	createEntityViewsIfNotExists({
		engine: args.engine,
		schema: LixConversationSchema,
		overrideName: "conversation",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: {
			id: () => nanoIdSync({ engine: args.engine }),
		},
	});

	// Create both primary and _all views for conversation_message with default ID generation
	createEntityViewsIfNotExists({
		engine: args.engine,
		schema: LixConversationMessageSchema,
		overrideName: "conversation_message",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: {
			id: () => nanoIdSync({ engine: args.engine }),
		},
	});
}

export const LixConversationSchema = {
	"x-lix-key": "lix_conversation",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	type: "object",
	properties: {
		id: { type: "string", "x-lix-generated": true },
		metadata: { type: "object", nullable: true },
	},
	required: ["id"],
	additionalProperties: false,
} as const;
LixConversationSchema satisfies LixSchemaDefinition;

export const LixConversationMessageSchema = {
	"x-lix-key": "lix_conversation_message",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	"x-lix-foreign-keys": [
		{
			properties: ["conversation_id"],
			references: {
				schemaKey: "lix_conversation",
				properties: ["id"],
			},
		},
		{
			properties: ["parent_id"],
			references: {
				schemaKey: "lix_conversation_message",
				properties: ["id"],
			},
		},
	],
	type: "object",
	properties: {
		id: { type: "string", "x-lix-generated": true },
		conversation_id: { type: "string" },
		parent_id: { type: "string", nullable: true },
		body: ZettelDocJsonSchema as any,
		metadata: { type: "object", nullable: true },
	},
	required: ["id", "conversation_id", "body"],
	additionalProperties: false,
} as const;
LixConversationMessageSchema satisfies LixSchemaDefinition;

export type LixConversation = FromLixSchemaDefinition<
	typeof LixConversationSchema
>;
export type LixConversationMessage = FromLixSchemaDefinition<
	typeof LixConversationMessageSchema
> & {
	body: ZettelDoc; // Override the body type
};
