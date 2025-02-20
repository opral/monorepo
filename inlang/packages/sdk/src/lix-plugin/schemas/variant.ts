import type { ExperimentalChangeSchema } from "@lix-js/sdk";

export const VariantSchemaV1 = {
	key: "lix_plugin_inlang_variant",
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
