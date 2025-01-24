import type { ExperimentalChangeSchema } from "@lix-js/sdk";

export const CellSchemaV1 = {
	key: "lix_plugin_csv_cell",
	type: "json",
	schema: {
		type: "object",
		properties: {
			text: { type: "string" },
			relationId: { type: "string" },
		},
		required: ["text"],
		additionalProperties: false,
	},
} as const satisfies ExperimentalChangeSchema;
