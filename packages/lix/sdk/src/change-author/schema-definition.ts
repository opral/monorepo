import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../schema-definition/definition.js";

export type LixChangeAuthor = FromLixSchemaDefinition<
	typeof LixChangeAuthorSchema
>;

export const LixChangeAuthorSchema = {
	"x-lix-key": "lix_change_author",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/change_id", "/account_id"],
	"x-lix-override-lixcols": {
		lixcol_file_id: '"lix"',
		lixcol_plugin_key: '"lix_sdk"',
		lixcol_version_id: '"global"',
	},
	"x-lix-foreign-keys": [
		{
			properties: ["/change_id"],
			references: {
				schemaKey: "lix_change",
				properties: ["/id"],
			},
		},
		{
			properties: ["/account_id"],
			references: {
				schemaKey: "lix_account",
				properties: ["/id"],
			},
		},
	],
	type: "object",
	properties: {
		change_id: { type: "string" },
		account_id: { type: "string" },
	},
	required: ["change_id", "account_id"],
	additionalProperties: false,
} as const;
LixChangeAuthorSchema satisfies LixSchemaDefinition;
