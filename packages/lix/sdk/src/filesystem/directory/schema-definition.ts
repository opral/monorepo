import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../../schema-definition/definition.js";

export type LixDirectoryDescriptor = FromLixSchemaDefinition<
	typeof LixDirectoryDescriptorSchema
>;

export const LixDirectoryDescriptorSchema = {
	"x-lix-key": "lix_directory_descriptor",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	"x-lix-unique": [["/parent_id", "/name"]],
	"x-lix-override-lixcols": {
		lixcol_file_id: '"lix"',
		lixcol_plugin_key: '"lix_sdk"',
	},
	type: "object",
	properties: {
		id: {
			type: "string",
			"x-lix-default": "lix_uuid_v7()",
		},
		parent_id: {
			type: "string",
			nullable: true,
			description:
				"Identifier of the parent directory. Null indicates the virtual root directory.",
		},
		name: {
			type: "string",
			pattern: "^[^/\\\\]+$",
			description: "Directory segment without slashes.",
		},
		hidden: {
			type: "boolean",
			"x-lix-default": "false",
		},
	},
	required: ["id", "parent_id", "name"],
	additionalProperties: false,
} as const;
LixDirectoryDescriptorSchema satisfies LixSchemaDefinition;
