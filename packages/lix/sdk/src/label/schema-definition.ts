import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../schema-definition/definition.js";

export type LixLabel = FromLixSchemaDefinition<typeof LixLabelSchema>;

export const LixLabelSchema = {
	"x-lix-key": "lix_label",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	"x-lix-defaults": {
		lixcol_file_id: "lix",
		lixcol_plugin_key: "lix_own_entity",
	},
	type: "object",
	properties: {
		id: {
			type: "string",
			"x-lix-generated": true,
			"x-lix-default": "lix_uuid_v7()",
		},
		name: { type: "string" },
	},
	required: ["id", "name"],
	additionalProperties: false,
} as const;
LixLabelSchema satisfies LixSchemaDefinition;
