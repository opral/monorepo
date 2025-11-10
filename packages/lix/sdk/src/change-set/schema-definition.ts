import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../schema-definition/definition.js";

export type LixChangeSet = FromLixSchemaDefinition<typeof LixChangeSetSchema>;

export const LixChangeSetSchema = {
	"x-lix-key": "lix_change_set",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	"x-lix-override-lixcols": {
		lixcol_file_id: '"lix"',
		lixcol_plugin_key: '"lix_sdk"',
		lixcol_version_id: '"global"',
	},
	type: "object",
	properties: {
		id: {
			type: "string",
			"x-lix-default": "lix_uuid_v7()",
		},
	},
	required: ["id"],
	additionalProperties: false,
} as const;
LixChangeSetSchema satisfies LixSchemaDefinition;

export type LixChangeSetElement = FromLixSchemaDefinition<
	typeof LixChangeSetElementSchema
>;

export const LixChangeSetElementSchema = {
	"x-lix-key": "lix_change_set_element",
	"x-lix-version": "1.0",
	"x-lix-foreign-keys": [
		{
			properties: ["/change_set_id"],
			references: {
				schemaKey: "lix_change_set",
				properties: ["/id"],
			},
		},
		{
			properties: ["/change_id"],
			references: {
				schemaKey: "lix_change",
				properties: ["/id"],
			},
		},
		{
			properties: ["/schema_key"],
			references: {
				schemaKey: "lix_stored_schema",
				properties: ["/value/x-lix-key"],
			},
		},
	],
	"x-lix-primary-key": ["/change_set_id", "/change_id"],
	"x-lix-unique": [["/change_set_id", "/entity_id", "/schema_key", "/file_id"]],
	"x-lix-override-lixcols": {
		lixcol_file_id: '"lix"',
		lixcol_plugin_key: '"lix_sdk"',
		lixcol_version_id: '"global"',
	},
	type: "object",
	properties: {
		change_set_id: { type: "string" },
		change_id: { type: "string" },
		entity_id: { type: "string" },
		schema_key: { type: "string" },
		file_id: { type: "string" },
	},
	required: [
		"change_set_id",
		"change_id",
		"entity_id",
		"schema_key",
		"file_id",
	],
	additionalProperties: false,
} as const;
LixChangeSetElementSchema satisfies LixSchemaDefinition;
