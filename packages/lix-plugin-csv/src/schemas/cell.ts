import type { ExperimentalChangeSchema } from "@lix-js/sdk";

export const CellSchemaV1 = {
	key: "lix-plugin-csv" + "-cell-v1",
	type: "json",
	schema: {
		type: "object",
		properties: {
			text: { type: "string" },
		},
		required: ["text"],
		additionalProperties: false,
	},
} as const satisfies ExperimentalChangeSchema;
