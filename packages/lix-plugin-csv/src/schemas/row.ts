import type { ExperimentalChangeSchema } from "@lix-js/sdk";

export const RowSchemaV1 = {
	key: "lix_plugin_csv_row",
	type: "json",
	schema: {
		type: "object",
		properties: {
			lineNumber: { type: "number" },
		},
		required: ["lineNumber"],
		additionalProperties: false,
	},
} as const satisfies ExperimentalChangeSchema;
