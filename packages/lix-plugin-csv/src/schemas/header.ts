import type { ExperimentalChangeSchema } from "@lix-js/sdk";

export const HeaderSchemaV1 = {
	key: "lix_plugin_csv_header",
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
