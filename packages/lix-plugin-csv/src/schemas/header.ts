import type { LixSchemaDefinition } from "@lix-js/sdk";

export const HeaderSchemaV1 = {
	"x-lix-key": "plugin_csv_header",
	"x-lix-version": "1.0",
	type: "object",
	properties: {
		columnNames: { type: "array", items: { type: "string" } },
	},
	required: ["columnNames"],
	additionalProperties: false,
} as const satisfies LixSchemaDefinition;
