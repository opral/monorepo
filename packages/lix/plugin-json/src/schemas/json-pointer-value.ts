import { JSONTypeSchema, type LixSchemaDefinition } from "@lix-js/sdk";

export const JSONPointerValueSchema = {
	"x-lix-key": "plugin_json_pointer_value",
	"x-lix-version": "1.0",
	type: "object",
	properties: {
		path: {
			type: "string",
			description:
				'RFC 6901 JSON Pointer referencing the selected JSON value (e.g. "/foo/0/bar").',
		},
		value: {
			...JSONTypeSchema,
			description: "JSON value located at the referenced pointer.",
		},
	},
	required: ["path", "value"],
	additionalProperties: false,
} as const satisfies LixSchemaDefinition;
