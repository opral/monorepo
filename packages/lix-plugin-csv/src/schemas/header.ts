import type { ExperimentalChangeSchema } from "@lix-js/sdk";

export const HeaderSchema = {
	key: "lix-plugin-csv-v2" + "-header",
	type: "json",
	schema: {
		type: "object",
		properties: {
			columnNames: { type: "array", items: { type: "string" } },
		},
		required: ["columnNames"],
		additionalProperties: false,
	},
} as const satisfies ExperimentalChangeSchema;
