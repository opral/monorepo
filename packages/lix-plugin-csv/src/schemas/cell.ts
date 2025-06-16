import type { LixSchemaDefinition } from "@lix-js/sdk";

export const CellSchemaV1 = {
	"x-lix-key": "plugin_csv_cell",
	"x-lix-version": "1.0",
	properties: {
		text: { type: "string" },
		rowId: { type: "string" },
	},
	required: ["text"],
	additionalProperties: false,
} as const satisfies LixSchemaDefinition;
