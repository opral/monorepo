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
	"x-lix-primary-key": ["id"],
	"x-lix-foreign-keys": [],
	"x-lix-defaults": {
		lixcol_file_id: "lix",
		lixcol_plugin_key: "lix_own_entity",
	},
	type: "object",
	properties: {
		id: { type: "string", "x-lix-generated": true },
		name: { type: "string", "x-lix-generated": true },
		inherits_from_version_id: { type: ["string", "null"] },
		hidden: { type: "boolean", "x-lix-generated": true },
	},
	required: ["id", "name"],
	additionalProperties: false,
} as const;
LixVersionDescriptorSchema satisfies LixSchemaDefinition;

export type LixVersionTip = FromLixSchemaDefinition<typeof LixVersionTipSchema>;

export const LixVersionTipSchema = {
	"x-lix-key": "lix_version_tip",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	"x-lix-unique": [["working_commit_id"]],
	"x-lix-foreign-keys": [
		{
			properties: ["commit_id"],
			references: { schemaKey: "lix_commit", properties: ["id"] },
			mode: "materialized",
		},
		{
			properties: ["working_commit_id"],
			references: { schemaKey: "lix_commit", properties: ["id"] },
			mode: "materialized",
		},
	],
	"x-lix-defaults": {
		lixcol_file_id: "lix",
		lixcol_plugin_key: "lix_own_entity",
	},
	type: "object",
	properties: {
		id: { type: "string", "x-lix-generated": true },
		commit_id: { type: "string", "x-lix-generated": true },
		working_commit_id: { type: "string", "x-lix-generated": true },
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
	"x-lix-primary-key": ["version_id"],
	"x-lix-foreign-keys": [
		{
			properties: ["version_id"],
			references: {
				schemaKey: "lix_version_descriptor",
				properties: ["id"],
			},
		},
	],
	"x-lix-defaults": {
		lixcol_file_id: "lix",
		lixcol_plugin_key: "lix_own_entity",
	},
	type: "object",
	properties: {
		version_id: { type: "string" },
	},
	required: ["version_id"],
	additionalProperties: false,
} as const;
LixActiveVersionSchema satisfies LixSchemaDefinition;

export type LixVersion = LixVersionTip & LixVersionDescriptor;
