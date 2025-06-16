import type { LixSchemaDefinition } from "@lix-js/sdk";

export const MarkdownBlockPositionSchemaV1 = {
	"x-lix-key": "lix_plugin_md_block_positions",
	"x-lix-version": "1.0",
	type: "object",
	properties: {
		idPositions: { type: "object" },
	},
	required: ["idPositions"],
	additionalProperties: false,
} as const satisfies LixSchemaDefinition;
