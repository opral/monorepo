import type {
	ExperimentalChangeSchema,
	ExperimentalInferType,
} from "@lix-js/sdk";

export type Row = ExperimentalInferType<typeof RowSchema>;

export const RowSchema = {
	key: "lix-plugin-csv-v2" + "-row",
	type: "json",
	schema: {
		type: "object",
		properties: {
			rowIndex: { type: "number" },
			rowEntities: { type: "array", items: { type: "string" } },
		},
		required: ["rowIndex", "rowEntities"],
		additionalProperties: false,
	},
} as const satisfies ExperimentalChangeSchema;
