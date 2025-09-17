import { JSONTypeSchema, type LixSchemaDefinition } from "@lix-js/sdk";

export const InlangMessageSchema = {
	"x-lix-key": "inlang_message",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	"x-lix-foreign-keys": [
		{
			properties: ["bundleId"],
			references: { schemaKey: "inlang_bundle", properties: ["id"] },
		},
	],
	type: "object",
	properties: {
		id: { type: "string" },
		bundleId: { type: "string" },
		locale: { type: "string" },
		selectors: JSONTypeSchema as any,
	},
	required: ["id", "bundleId", "locale", "selectors"],
	additionalProperties: false,
} as const satisfies LixSchemaDefinition;
