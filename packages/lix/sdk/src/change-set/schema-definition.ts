import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../schema-definition/definition.js";

export type LixChangeSet = FromLixSchemaDefinition<typeof LixChangeSetSchema>;

export const LixChangeSetSchema = {
	"x-lix-key": "lix_change_set",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	"x-lix-defaults": {
		lixcol_file_id: "lix",
		lixcol_plugin_key: "lix_own_entity",
	},
	type: "object",
	properties: {
		id: { type: "string", "x-lix-generated": true },
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
			properties: ["change_set_id"],
			references: {
				schemaKey: "lix_change_set",
				properties: ["id"],
			},
		},
		{
			properties: ["change_id"],
			references: {
				schemaKey: "lix_change",
				properties: ["id"],
			},
		},
		{
			properties: ["schema_key"],
			references: {
				schemaKey: "lix_stored_schema",
				properties: ["key"],
			},
		},
	],
	"x-lix-primary-key": ["change_set_id", "change_id"],
	"x-lix-unique": [["change_set_id", "entity_id", "schema_key", "file_id"]],
	"x-lix-defaults": {
		lixcol_file_id: "lix",
		lixcol_plugin_key: "lix_own_entity",
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

export type LixChangeSetLabel = FromLixSchemaDefinition<
	typeof LixChangeSetLabelSchema
>;

export const LixChangeSetLabelSchema = {
	"x-lix-key": "lix_change_set_label",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["change_set_id", "label_id"],
	"x-lix-defaults": {
		lixcol_file_id: "lix",
		lixcol_plugin_key: "lix_own_entity",
	},
	"x-lix-foreign-keys": [
		{
			properties: ["change_set_id"],
			references: {
				schemaKey: "lix_change_set",
				properties: ["id"],
			},
		},
		{
			properties: ["label_id"],
			references: {
				schemaKey: "lix_label",
				properties: ["id"],
			},
		},
	],
	type: "object",
	properties: {
		change_set_id: { type: "string" },
		label_id: { type: "string" },
	},
	required: ["change_set_id", "label_id"],
	additionalProperties: false,
} as const;
LixChangeSetLabelSchema satisfies LixSchemaDefinition;
