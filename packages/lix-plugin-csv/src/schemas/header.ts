import type {
	ExperimentalChangeSchema,
	ExperimentalInferType,
} from "@lix-js/sdk";

export type Header = ExperimentalInferType<typeof HeaderSchema>;

export const HeaderSchema = {
	key: "lix-plugin-csv-v2" + "-header",
	type: "json",
	schema: {
		type: "object",
		properties: {
			fields: { type: "string" },
		},
		required: ["text"],
		additionalProperties: false,
	},
} as const satisfies ExperimentalChangeSchema;
