import type { ExperimentalChangeSchema } from "@lix-js/sdk";

export const RowSchemaV1 = {
	key: "lix-plugin-csv" + "-row-v1",
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
