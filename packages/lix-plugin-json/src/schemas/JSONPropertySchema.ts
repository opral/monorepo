import type { ExperimentalChangeSchema } from "@lix-js/sdk";

export const JSONPropertySchema = {
	key: "lix_plugin_json_property",
	type: "json",
	schema: {
		type: "object",
		properties: {
			property: { type: "string" },
		},
		required: ["property"],
		additionalProperties: true,
	},
} as const satisfies ExperimentalChangeSchema;
