import type { FromSchema, JSONSchema } from "json-schema-to-ts";

export const EntitySchemaJsonSchema = {
	$schema: "http://json-schema.org/draft-07/schema#",
	title: "Lix Change Schema",
	description:
		"A JSON schema document that also includes custom x-key and x-version properties for identification and versioning.",
	allOf: [
		{
			$ref: "http://json-schema.org/draft-07/schema#",
		},
		{
			type: "object",
			properties: {
				"x-key": {
					type: "string",
					description:
						"The key of the schema. The key is used to identify the schema. You must use a unique key for each schema.",
					examples: ["csv_plugin_cell"],
				},
				"x-version": {
					type: "string",
					description:
						"The version of the schema. Use the major version to signal breaking changes. Use the minor version to signal non-breaking changes.",
					pattern: "^\\d+\\.\\d+$",
					examples: ["1.0"],
				},
			},
			required: ["x-key", "x-version"],
		},
	],
} as const;

export type EntitySchema = JSONSchema & {
	/**
	 * The key of the schema.
	 *
	 * The key is used to identify the schema. You must use a
	 * unique key for each schema.
	 *
	 * @example
	 *   "csv_plugin_cell"
	 */
	"x-key": string;
	/**
	 * The version of the schema.
	 *
	 * Use the major version to signal breaking changes.
	 * Use the minor version to signal non-breaking changes.
	 *
	 * @example
	 *   "1.0"
	 */
	"x-version": string;
};

export type FromEntitySchema<T extends EntitySchema> = FromSchema<T>;
