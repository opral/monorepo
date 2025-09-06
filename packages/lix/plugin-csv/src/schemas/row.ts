import type { LixSchemaDefinition } from "@lix-js/sdk";

export const RowSchemaV1 = {
	"x-lix-key": "plugin_csv_row",
	"x-lix-version": "1.0",
	type: "object",
	properties: {
		lineNumber: { type: "number" },
	},
	required: ["lineNumber"],
	additionalProperties: false,
} as const satisfies LixSchemaDefinition;
