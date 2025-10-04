import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../../schema-definition/definition.js";

export type LixFileDescriptor = FromLixSchemaDefinition<
	typeof LixFileDescriptorSchema
>;

export const LixFileDescriptorSchema = {
	"x-lix-key": "lix_file_descriptor",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	"x-lix-unique": [["directory_id", "name", "extension"]],
	type: "object",
	properties: {
		id: { type: "string", "x-lix-generated": true },
		directory_id: {
			type: "string",
			nullable: true,
			description:
				"Identifier of the directory containing the file. Null indicates the virtual root directory.",
		},
		name: {
			type: "string",
			pattern: "^[^/\\\\]+$",
			description: "File name without directory segments.",
		},
		extension: {
			type: "string",
			nullable: true,
			pattern: "^[^./\\\\]+$",
			description:
				"File extension without the leading dot. Null when no extension is present.",
		},
		metadata: {
			type: "object",
			nullable: true,
		},
		hidden: { type: "boolean", "x-lix-generated": true },
	},
	required: ["id", "directory_id", "name", "extension"],
	additionalProperties: false,
} as const;
LixFileDescriptorSchema satisfies LixSchemaDefinition;
