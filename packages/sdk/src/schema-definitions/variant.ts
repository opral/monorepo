import { JSONTypeSchema, type LixSchemaDefinition } from "@lix-js/sdk";

export const InlangVariantSchema = {
	"x-lix-key": "inlang_variant",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	"x-lix-foreign-keys": [
		{
			properties: ["messageId"],
			references: { schemaKey: "inlang_message", properties: ["id"] },
		},
	],
	type: "object",
	properties: {
		id: { type: "string" },
		messageId: { type: "string" },
		matches: JSONTypeSchema,
		pattern: JSONTypeSchema,
	},
	required: ["id", "messageId", "matches", "pattern"],
	additionalProperties: false,
} as const satisfies LixSchemaDefinition;
