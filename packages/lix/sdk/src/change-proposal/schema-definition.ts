import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../schema-definition/definition.js";

export type LixChangeProposal = FromLixSchemaDefinition<
	typeof LixChangeProposalSchema
>;

export const LixChangeProposalSchema = {
	"x-lix-key": "lix_change_proposal",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	"x-lix-override-lixcols": {
		lixcol_file_id: '"lix"',
		lixcol_plugin_key: '"lix_own_entity"',
		lixcol_version_id: '"global"',
	},
	"x-lix-foreign-keys": [
		{
			properties: ["/source_version_id"],
			references: { schemaKey: "lix_version_descriptor", properties: ["/id"] },
		},
		{
			properties: ["/target_version_id"],
			references: { schemaKey: "lix_version_descriptor", properties: ["/id"] },
		},
	],
	type: "object",
	properties: {
		id: {
			type: "string",
			"x-lix-generated": true,
			"x-lix-default": "lix_uuid_v7()",
		},
		source_version_id: { type: "string" },
		target_version_id: { type: "string" },
		status: { type: "string", "x-lix-generated": true, default: "open" },
	},
	required: ["id", "source_version_id", "target_version_id", "status"],
	additionalProperties: false,
} as const;
LixChangeProposalSchema satisfies LixSchemaDefinition;
