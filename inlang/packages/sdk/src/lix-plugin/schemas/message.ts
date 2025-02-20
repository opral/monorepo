import type { ExperimentalChangeSchema } from "@lix-js/sdk";

export const MessageSchemaV1 = {
	key: "lix_plugin_inlang_message",
	type: "json",
	schema: {
		type: "object",
		properties: {
			id: { type: "string" },
		},
		required: ["id"],
		additionalProperties: true,
	},
} as const satisfies ExperimentalChangeSchema;
