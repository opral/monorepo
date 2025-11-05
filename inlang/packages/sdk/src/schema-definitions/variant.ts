import { JSONTypeSchema, type LixSchemaDefinition } from "@lix-js/sdk";

export const InlangVariantSchema = {
	"x-lix-key": "inlang_variant",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	"x-lix-foreign-keys": [
		{
			properties: ["/messageId"],
			references: { schemaKey: "inlang_message", properties: ["/id"] },
		},
	],
	"x-lix-override-lixcols": {
		lixcol_file_id: '"inlang"',
		lixcol_plugin_key: '"inlang_sdk"',
	},
	type: "object",
	properties: {
		id: { type: "string", "x-lix-default": "lix_uuid_v7()" },
		messageId: { type: "string" },
		matches: { ...JSONTypeSchema, default: [] },
		pattern: { ...JSONTypeSchema, default: [] },
	},
	required: ["id", "messageId", "matches", "pattern"],
	additionalProperties: false,
} as const satisfies LixSchemaDefinition;
