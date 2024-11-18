import type { ExperimentalChangeSchema } from "@lix-js/sdk";

export const RowSchema = {
	key: "lix-plugin-csv-v2" + "-row",
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
