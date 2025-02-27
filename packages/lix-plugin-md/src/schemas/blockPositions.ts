import type { ExperimentalChangeSchema } from "@lix-js/sdk";

export const MarkdownBlockPositionSchemaV1 = {
	key: "lix_plugin_md_block_positions",
	type: "json",
	schema: {
		type: "object",
		properties: {
			idPositions: { type: "object" },
		},
		required: ["idPositions"],
		additionalProperties: false,
	},
} as const satisfies ExperimentalChangeSchema;
