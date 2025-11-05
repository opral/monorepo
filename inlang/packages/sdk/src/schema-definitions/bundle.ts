import { JSONTypeSchema, type LixSchemaDefinition } from "@lix-js/sdk";

export const InlangBundleSchema = {
	"x-lix-key": "inlang_bundle",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	"x-lix-override-lixcols": {
		lixcol_file_id: '"inlang"',
		lixcol_plugin_key: '"inlang_sdk"',
	},
	type: "object",
	properties: {
		id: { type: "string", "x-lix-default": "lix_human_id()" },
		declarations: { ...JSONTypeSchema, default: [] },
	},
	required: ["id", "declarations"],
	additionalProperties: false,
} as const satisfies LixSchemaDefinition;
