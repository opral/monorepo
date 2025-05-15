import type { FromSchema, JSONSchema } from "json-schema-to-ts";

export const LixSchemaDefinition = {
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
				"x-lix-unique": {
					type: "array",
					items: {
						type: "array",
						items: {
							type: "string",
						},
					},
				},
				"x-primary-key": {
					type: "array",
					items: {
						type: "string",
					},
				},
				"x-lix-key": {
					type: "string",
					description:
						"The key of the schema. The key is used to identify the schema. You must use a unique key for each schema.",
					examples: ["csv_plugin_cell"],
				},
				"x-lix-version": {
					type: "string",
					description:
						"The version of the schema. Use the major version to signal breaking changes. Use the minor version to signal non-breaking changes.",
					pattern: "^\\d+\\.\\d+$",
					examples: ["1.0"],
				},
			},
			required: ["x-lix-key", "x-lix-version"],
		},
	],
} as const;

/**
 * LixSchema
 *
 * A superset of JSON Schema (draft-07) that includes Lix-specific metadata
 * and supports custom extensions.
 *
 * Custom extensions may be added with any x-* prefix.
 */
export type LixSchemaDefinition = JSONSchema & {
	/**
	 * The key of the schema.
	 *
	 * The key is used to identify the schema. You must use a
	 * unique key for each schema.
	 *
	 * @example
	 *   "csv_plugin_cell"
	 */
	"x-lix-key": string;
	/**
	 * The version of the schema.
	 *
	 * Use the major version to signal breaking changes.
	 * Use the minor version to signal non-breaking changes.
	 *
	 * @example
	 *   "1.0"
	 */
	"x-lix-version": string;
	"x-lix-primary-key"?: string[] | readonly string[];
	/**
	 * Properties that must be unique per version.
	 *
	 * Not to be confused by `x-version` which is used for versioning the schema.
	 *
	 *
	 * @example
	 *   {
	 *     "x-lix-unique": [
	 *       // the id must be unique
	 *       ["id"],
	 *       // the name and age must be unique as well
	 *       ["name", "age"],
	 *     ],
	 *     properties: {
	 *       id: { type: "string" },
	 *       name: { type: "string" },
	 *       age: { type: "number" },
	 *     },
	 *   }
	 */
	"x-lix-unique"?: string[][] | readonly (readonly string[])[];
};

export type FromLixSchemaDefinition<T extends LixSchemaDefinition> =
	FromSchema<T>;
