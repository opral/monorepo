import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../schema-definition/definition.js";

export type LixVersionDescriptor = FromLixSchemaDefinition<
	typeof LixVersionDescriptorSchema
>;

export const LixVersionDescriptorSchema = {
	"x-lix-key": "lix_version_descriptor",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	"x-lix-foreign-keys": [],
	"x-lix-override-lixcols": {
		lixcol_file_id: '"lix"',
		lixcol_plugin_key: '"lix_own_entity"',
	},
	type: "object",
	properties: {
		id: {
			type: "string",
			"x-lix-default": "lix_uuid_v7()",
		},
		name: {
			type: "string",
			"x-lix-default": "lix_human_id()",
		},
		inherits_from_version_id: { type: ["string", "null"] },
		hidden: {
			type: "boolean",
			"x-lix-default": "false",
		},
	},
	required: ["id", "name"],
	additionalProperties: false,
} as const;
LixVersionDescriptorSchema satisfies LixSchemaDefinition;

export type LixVersionTip = FromLixSchemaDefinition<typeof LixVersionTipSchema>;

export const LixVersionTipSchema = {
	"x-lix-key": "lix_version_tip",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	"x-lix-unique": [["/working_commit_id"]],
	"x-lix-foreign-keys": [
		{
			properties: ["/commit_id"],
			references: { schemaKey: "lix_commit", properties: ["/id"] },
			mode: "materialized",
		},
		{
			properties: ["/working_commit_id"],
			references: { schemaKey: "lix_commit", properties: ["/id"] },
			mode: "materialized",
		},
	],
	"x-lix-override-lixcols": {
		lixcol_file_id: '"lix"',
		lixcol_plugin_key: '"lix_own_entity"',
	},
	type: "object",
	properties: {
		id: { type: "string", "x-lix-default": "lix_nano_id()" },
		commit_id: { type: "string" },
		working_commit_id: { type: "string" },
	},
	required: ["id", "commit_id", "working_commit_id"],
	additionalProperties: false,
} as const;
LixVersionTipSchema satisfies LixSchemaDefinition;

export type LixActiveVersion = FromLixSchemaDefinition<
	typeof LixActiveVersionSchema
>;

export const LixActiveVersionSchema = {
	"x-lix-key": "lix_active_version",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	"x-lix-foreign-keys": [
		{
			properties: ["/version_id"],
			references: {
				schemaKey: "lix_version_descriptor",
				properties: ["/id"],
			},
		},
	],
	"x-lix-override-lixcols": {
		lixcol_file_id: '"lix"',
		lixcol_plugin_key: '"lix_own_entity"',
		lixcol_untracked: "1",
		lixcol_version_id: '"global"',
	},
	"x-lix-entity-views": ["state"],
	type: "object",
	properties: {
		id: {
			type: "string",
			"x-lix-default": "lix_nano_id()",
		},
		version_id: { type: "string" },
	},
	required: ["id", "version_id"],
	additionalProperties: false,
} as const;
LixActiveVersionSchema satisfies LixSchemaDefinition;

export type LixVersion = LixVersionTip & LixVersionDescriptor;
