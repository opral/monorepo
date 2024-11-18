import type { ExperimentalChangeSchema } from "@lix-js/sdk";

export const CellSchema = {
	key: "lix-plugin-csv-v2" + "-cell",
	type: "json",
	schema: {
		type: "object",
		properties: {
			text: { type: "string" },
		},
		required: ["text"],
	},
} as const satisfies ExperimentalChangeSchema;
