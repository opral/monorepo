import type { ExperimentalChangeSchema } from "@lix-js/sdk";

export const HeaderSchemaV1 = {
	key: "lix-plugin-csv" + "-header-v1",
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
