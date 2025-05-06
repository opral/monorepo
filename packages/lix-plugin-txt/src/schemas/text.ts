import type { ExperimentalChangeSchema } from "@lix-js/sdk";

export const TextSchemaV1 = {
	key: "lix_plugin_txt",
	type: "json",
	schema: {
		type: "object",
		properties: {
			id: { type: "string" },
			content: { type: "string" },
		},
		required: ["id", "content"],
		additionalProperties: false,
	},
} as const satisfies ExperimentalChangeSchema;
