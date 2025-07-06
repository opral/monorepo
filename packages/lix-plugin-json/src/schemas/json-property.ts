import { JSONTypeSchema, type LixSchemaDefinition } from "@lix-js/sdk";

export const JSONPropertySchema = {
	"x-lix-key": "plugin_json_property",
	"x-lix-version": "1.0",
	type: "object",
	properties: {
		property: { type: "string" },
		value: JSONTypeSchema,
	},
	required: ["property", "value"],
	additionalProperties: false,
} as const satisfies LixSchemaDefinition;
