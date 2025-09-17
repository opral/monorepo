import { JSONTypeSchema, type LixSchemaDefinition } from "@lix-js/sdk";

export const InlangBundleSchema = {
	"x-lix-key": "inlang_bundle",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	type: "object",
	properties: {
		id: { type: "string" },
		declarations: JSONTypeSchema as any,
	},
	required: ["id", "declarations"],
	additionalProperties: false,
} as const satisfies LixSchemaDefinition;
