import type { LixSchemaDefinition } from "@lix-js/sdk";

export const TextSchemaV1 = {
	"x-lix-key": "plugin_txt",
	"x-lix-version": "1.0",
	type: "object",
	properties: {
		text: { type: "string" },
	},
	required: ["text"],
	additionalProperties: false,
} as const satisfies LixSchemaDefinition;
