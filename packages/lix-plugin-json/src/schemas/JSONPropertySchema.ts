import type { LixSchemaDefinition } from "@lix-js/sdk";

export const JSONPropertySchema = {
	"x-lix-key": "plugin_json_property",
	"x-lix-version": "1.0",
	properties: {
		property: { type: "string" },
	},
	required: ["property"],
	additionalProperties: true,
} as const satisfies LixSchemaDefinition;
