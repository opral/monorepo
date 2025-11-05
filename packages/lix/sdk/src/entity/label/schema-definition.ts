import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../../schema-definition/definition.js";

export type LixEntityLabel = FromLixSchemaDefinition<
	typeof LixEntityLabelSchema
>;

export const LixEntityLabelSchema = {
	"x-lix-key": "lix_entity_label",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/entity_id", "/schema_key", "/file_id", "/label_id"],
	"x-lix-override-lixcols": {
		lixcol_file_id: '"lix"',
		lixcol_plugin_key: '"lix_own_entity"',
	},
	"x-lix-foreign-keys": [
		{
			properties: ["/entity_id", "/schema_key", "/file_id"],
			references: {
				schemaKey: "state",
				properties: ["/entity_id", "/schema_key", "/file_id"],
			},
		},
		{
			properties: ["/label_id"],
			references: {
				schemaKey: "lix_label",
				properties: ["/id"],
			},
		},
	],
	type: "object",
	properties: {
		entity_id: { type: "string" },
		schema_key: { type: "string" },
		file_id: { type: "string" },
		label_id: { type: "string" },
	},
	required: ["entity_id", "schema_key", "file_id", "label_id"],
	additionalProperties: false,
} as const;
LixEntityLabelSchema satisfies LixSchemaDefinition;
