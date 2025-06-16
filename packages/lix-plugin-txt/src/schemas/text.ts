import type { LixSchemaDefinition } from "@lix-js/sdk";

export const TextSchemaV1 = {
	"x-lix-key": "plugin_txt",
	"x-lix-version": "1.0",
	type: "object",
	properties: {
		id: { type: "string" },
		content: { type: "string" },
	},
	required: ["id", "content"],
	additionalProperties: false,
} as const satisfies LixSchemaDefinition;
