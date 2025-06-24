import type { LixSchemaDefinition } from "@lix-js/sdk";

export const MarkdownRootSchemaV1 = {
	"x-lix-key": "lix_plugin_md_root",
	"x-lix-version": "1.0",
	type: "object",
	properties: {
		order: {
			type: "array",
			items: { type: "string" },
			description: "Array of node IDs in their order within the document"
		}
	},
	required: ["order"],
	additionalProperties: false
} as const satisfies LixSchemaDefinition;