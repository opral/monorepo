import { JSONTypeSchema, type LixSchemaDefinition } from "@lix-js/sdk";

export const InlangMessageSchema = {
	"x-lix-key": "inlang_message",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	"x-lix-foreign-keys": [
		{
			properties: ["/bundleId"],
			references: { schemaKey: "inlang_bundle", properties: ["/id"] },
		},
	],
	"x-lix-override-lixcols": {
		lixcol_file_id: '"inlang"',
		lixcol_plugin_key: '"inlang_sdk"',
	},
	type: "object",
	properties: {
		id: { type: "string", "x-lix-default": "lix_uuid_v7()" },
		bundleId: { type: "string" },
		locale: { type: "string" },
		selectors: { ...JSONTypeSchema, default: [] },
	},
	required: ["id", "bundleId", "locale", "selectors"],
	additionalProperties: false,
} as const satisfies LixSchemaDefinition;
