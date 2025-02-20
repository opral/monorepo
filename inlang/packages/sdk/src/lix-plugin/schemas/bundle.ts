import type { ExperimentalChangeSchema } from "@lix-js/sdk";

export const BundleSchemaV1 = {
	key: "lix_plugin_inlang_bundle",
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
