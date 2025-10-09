import type { FromSchema, JSONSchema } from "json-schema-to-ts";
import type { JsonPointer } from "./json-pointer.js";

/**
 * Foreign key constraint definition
 */
export type LixForeignKey = {
	/**
	 * Local JSON-schema property names that participate in the FK.
	 * Must have at least one property.
	 */
	properties: readonly JsonPointer[] | JsonPointer[];

	/**
	 * Where they point to.
	 */
	references: {
		/**
		 * The x-lix-key of the referenced schema
		 */
		schemaKey: string;
		/**
		 * Remote property names (must have same length as local properties)
		 */
		properties: readonly JsonPointer[] | JsonPointer[];
		/**
		 * Optional version of the referenced schema
		 */
		schemaVersion?: string;
	};

	/**
	 * Validation mode for this foreign key.
	 * - "immediate" (default): validate referenced existence on insert/update; restrict deletion when referenced.
	 * - "materialized": skip insert/update existence checks (reference is derived/materialized later);
	 *   still restrict deletion when referenced.
	 */
	mode?: "immediate" | "materialized";

	// Future features - not implemented yet
	// onDelete?: "cascade" | "restrict" | "set null";
	// onUpdate?: "cascade" | "restrict";
};

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
							format: "json-pointer",
							description: "JSON Pointer referencing a property",
						},
					},
				},
				additionalProperties: {
					type: "boolean",
					const: false,
					description:
						"Objects describing Lix schemas must not allow arbitrary additional properties; set this explicitly to false.",
				},
				"x-primary-key": {
					type: "array",
					items: {
						type: "string",
						format: "json-pointer",
						description:
							"JSON Pointer referencing a property that participates in the primary key.",
					},
				},
				"x-lix-foreign-keys": {
					type: "array",
					items: {
						type: "object",
						required: ["properties", "references"],
						properties: {
							properties: {
								type: "array",
								minItems: 1,
								items: {
									type: "string",
									format: "json-pointer",
									description: "JSON Pointer referencing the local field.",
								},
								description:
									"Local JSON-schema property names that participate in the FK",
							},
							references: {
								type: "object",
								required: ["schemaKey", "properties"],
								properties: {
									schemaKey: {
										type: "string",
										description: "The x-lix-key of the referenced schema",
									},
									properties: {
										type: "array",
										minItems: 1,
										items: {
											type: "string",
											format: "json-pointer",
											description: "JSON Pointer referencing the remote field.",
										},
										description:
											"Remote property names (same length as local properties)",
									},
									schemaVersion: {
										type: "string",
										pattern: "^\\d+\\.\\d+$",
										description: "Optional version of the referenced schema",
									},
								},
							},
							mode: {
								type: "string",
								enum: ["immediate", "materialized"],
								description:
									"Validation mode: immediate (default) or materialized (defer insert/update existence checks)",
							},
							// onDelete: {
							//   type: "string",
							//   enum: ["cascade", "restrict", "set null"],
							//   description: "Action to take when referenced entity is deleted (future feature)"
							// },
							// onUpdate: {
							//   type: "string",
							//   enum: ["cascade", "restrict"],
							//   description: "Action to take when referenced entity is updated (future feature)"
							// },
						},
					},
				},
				"x-lix-key": {
					type: "string",
					description:
						"The key of the schema. The key is used to identify the schema. You must use a unique key for each schema.",
					examples: ["csv_plugin_cell"],
				},
				"x-lix-immutable": {
					type: "boolean",
					description:
						"When true, entities for this schema cannot be updated after creation.",
				},
				"x-lix-defaults": {
					type: "object",
					description:
						"Default metadata column values (such as lixcol_file_id). Does not affect JSON property defaults.",
					additionalProperties: {
						anyOf: [
							{ type: "string" },
							{ type: "number" },
							{ type: "boolean" },
							{ type: "null" },
						],
					},
				},
				"x-lix-version": {
					type: "string",
					description:
						"The version of the schema. Use the major version to signal breaking changes. Use the minor version to signal non-breaking changes.",
					pattern: "^\\d+\\.\\d+$",
					examples: ["1.0"],
				},
				properties: {
					type: "object",
					additionalProperties: {
						allOf: [
							{ $ref: "http://json-schema.org/draft-07/schema#" },
							{
								type: "object",
								properties: {
									"x-lix-generated": {
										type: "boolean",
										description:
											"Whether this property is auto-generated by the database",
									},
									"x-lix-default": {
										type: "string",
										format: "cel",
										description:
											"CEL expression evaluated to produce the default value when the property is omitted.",
									},
									"x-lix-default-call": {
										type: "object",
										required: ["name"],
										properties: {
											name: {
												type: "string",
												description:
													"Engine function to invoke when the property is omitted (e.g. lix_uuid_v7)",
											},
											args: {
												type: "object",
												additionalProperties: {
													anyOf: [
														{ type: "string" },
														{ type: "number" },
														{ type: "boolean" },
														{ type: "null" },
														{ type: "object" },
													],
												},
												description:
													"Optional JSON-serializable arguments passed to the default function.",
											},
										},
										description:
											"Invoke an engine function when the property is omitted. Overrides the JSON `default` value when both are present. Unknown functions cause an error at rewrite time.",
									},
								},
							},
						],
					},
				},
			},
			required: ["x-lix-key", "x-lix-version"],
		},
	],
} as const;

/**
 * Extended property schema that includes Lix-specific extensions
 */
type LixPropertySchema = JSONSchema & {
	"x-lix-generated"?: boolean;
	"x-lix-default"?: string;
	"x-lix-default-call"?: {
		name: string;
		args?: Record<
			string,
			string | number | boolean | null | Record<string, unknown>
		>;
	};
};

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
	 * Marks the schema as immutable. Immutable entities may be inserted but cannot be updated.
	 */
	"x-lix-immutable"?: boolean;
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
	/**
	 * Default metadata column values applied by entity-view rewrites (e.g. `lixcol_file_id`).
	 * Does not provide defaults for JSON properties inside `properties`.
	 */
	"x-lix-defaults"?: Record<string, string | number | boolean | null>;
	"x-lix-primary-key"?: JsonPointer[] | readonly JsonPointer[];
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
	 *       ["/id"],
	 *       // the name and age must be unique as well
	 *       ["/name", "/age"],
	 *     ],
	 *     properties: {
	 *       id: { type: "string" },
	 *       name: { type: "string" },
	 *       age: { type: "number" },
	 *     },
	 *   }
	 */
	"x-lix-unique"?: JsonPointer[][] | readonly (readonly JsonPointer[])[];
	/**
	 * Foreign key constraints referencing other schemas.
	 *
	 * @example
	 *   [
	 *     {
	 *       "properties": ["/author_id"],
	 *       "references": {
	 *         "schemaKey": "user_profile",
	 *         "properties": ["/id"]
	 *       }
	 *     },
	 *     {
	 *       "properties": ["/entity_id", "/schema_key", "/file_id"],
	 *       "references": {
	 *         "schemaKey": "state",
	 *         "properties": ["/entity_id", "/schema_key", "/file_id"]
	 *       }
	 *     }
	 *   ]
	 */
	"x-lix-foreign-keys"?: LixForeignKey[] | readonly LixForeignKey[];
	type: "object";
	/**
	 * Has to be false to know the schema beforehand.
	 */
	additionalProperties: false;
	properties?: {
		[key: string]: LixPropertySchema;
	};
};

/**
 * Marker type for database columns that are auto-generated.
 *
 * This type brands values as "generated" to enable special handling in insert/update
 * operations. Generated fields become optional in inserts since the database
 * provides default values.
 *
 * The type accepts T values directly for developer convenience while preserving
 * the generated marker for type transformations.
 *
 * @example
 * ```typescript
 * type Account = {
 *   id: LixGenerated<string>;  // Auto-generated UUID
 *   name: string;              // User-provided
 *   created_at: LixGenerated<string>;  // Auto-generated timestamp
 * };
 *
 * // In inserts, generated fields are optional
 * const newAccount: LixInsertable<Account> = {
 *   name: "John"  // id and created_at are optional
 * };
 * ```
 */
export type LixGenerated<T> = T & {
	readonly __lixGenerated?: true;
};

/**
 * Check if a type has the LixGenerated brand
 */
type IsLixGenerated<T> = T extends { readonly __lixGenerated?: true }
	? true
	: false;

/**
 * Extract the base type from LixGenerated<T>
 * Since LixGenerated<T> = T & { brand }, we need to extract T
 */
type ExtractFromGenerated<T> = T extends LixGenerated<infer U> ? U : T;

/**
 * Extract the select type from LixGenerated or return the type as-is
 */
type SelectType<T> = ExtractFromGenerated<T>;

/**
 * Extract the insert type from LixGenerated or return the type as-is
 */
type InsertType<T> =
	IsLixGenerated<T> extends true ? ExtractFromGenerated<T> | undefined : T;

/**
 * Extract the update type from LixGenerated or return the type as-is
 */
type UpdateType<T> = ExtractFromGenerated<T>;

/**
 * Evaluates to K if T can be null or undefined
 */
type IfNullable<T, K> = undefined extends T ? K : null extends T ? K : never;

/**
 * Evaluates to K if T can't be null or undefined
 */
type IfNotNullable<T, K> = undefined extends T
	? never
	: null extends T
		? never
		: T extends never
			? never
			: K;

/**
 * Keys whose InsertType can be null or undefined (optional in inserts)
 */
type NullableInsertKeys<T> = {
	[K in keyof T]: IfNullable<InsertType<T[K]>, K>;
}[keyof T];

/**
 * Keys whose InsertType can't be null or undefined (required in inserts)
 */
type NonNullableInsertKeys<T> = {
	[K in keyof T]: IfNotNullable<InsertType<T[K]>, K>;
}[keyof T];

/**
 * Transform a type for insert operations.
 *
 * This type makes LixGenerated fields optional while keeping other required
 * fields mandatory. Use this when defining types for creating new entities.
 *
 * The database will automatically populate generated fields (like IDs,
 * timestamps) if not provided.
 *
 * @example
 * ```typescript
 * type Account = {
 *   id: LixGenerated<string>;
 *   name: string;
 *   email: string;
 *   created_at: LixGenerated<string>;
 * };
 *
 * type NewAccount = LixInsertable<Account>;
 * // Result: { name: string; email: string; id?: string; created_at?: string; }
 *
 * const account: NewAccount = {
 *   name: "John",
 *   email: "john@example.com"
 *   // id and created_at are optional
 * };
 * ```
 */
export type LixInsertable<T> = {
	[K in NonNullableInsertKeys<T>]: InsertType<T[K]>;
} & {
	[K in NullableInsertKeys<T>]?: InsertType<T[K]>;
};

/**
 * Transform a type for update operations.
 *
 * This type makes all fields optional, allowing partial updates where you
 * only specify the fields you want to change. LixGenerated markers are
 * removed since you're providing explicit values.
 *
 * The database preserves existing values for any fields not included
 * in the update.
 *
 * @example
 * ```typescript
 * type Account = {
 *   id: LixGenerated<string>;
 *   name: string;
 *   email: string;
 *   updated_at: LixGenerated<string>;
 * };
 *
 * type AccountUpdate = LixUpdateable<Account>;
 * // Result: { id?: string; name?: string; email?: string; updated_at?: string; }
 *
 * // Update only the email
 * const updates: AccountUpdate = {
 *   email: "newemail@example.com"
 *   // Other fields remain unchanged
 * };
 * ```
 */
export type LixUpdateable<T> = {
	[K in keyof T]?: UpdateType<T[K]>;
};

/**
 * Transform a type for select/query operations.
 *
 * This type unwraps all LixGenerated markers, giving you the actual engine
 * types that will be returned from database queries. All fields are required
 * and have their base types.
 *
 * Use this type when defining the shape of data returned from queries or
 * when passing entity data to UI components.
 *
 * @example
 * ```typescript
 * type Account = {
 *   id: LixGenerated<string>;
 *   name: string;
 *   email: string;
 *   created_at: LixGenerated<string>;
 * };
 *
 * type AccountData = LixSelectable<Account>;
 * // Result: { id: string; name: string; email: string; created_at: string; }
 *
 * // Query results have this shape
 * const accounts: AccountData[] = await db
 *   .selectFrom("account")
 *   .selectAll()
 *   .execute();
 *
 * console.log(accounts[0].id);  // string (not LixGenerated<string>)
 * ```
 */
export type LixSelectable<T> = {
	[K in keyof T]: SelectType<T[K]>;
};

/**
 * Transform object types with no properties from unknown to Record<string, any>
 */
type TransformEmptyObject<T> = T extends { [x: string]: unknown }
	? Record<string, any>
	: T;

/**
 * Check if a schema property is an empty object type (no properties defined)
 */
type IsEmptyObjectSchema<P> = P extends { type: "object" }
	? P extends { properties: any }
		? false
		: true
	: false;

/**
 * Get the nullable part of a type based on schema
 */
type GetNullablePart<P> = P extends { nullable: true } ? null : never;

/**
 * Internal type that applies LixGenerated markers to properties with x-lix-generated: true
 */
type ApplyLixGenerated<TSchema extends LixSchemaDefinition> = TSchema extends {
	properties: infer Props;
}
	? {
			[K in keyof FromSchema<TSchema>]: K extends keyof Props
				? Props[K] extends { "x-lix-generated": true }
					? LixGenerated<TransformEmptyObject<FromSchema<TSchema>[K]>>
					: IsEmptyObjectSchema<Props[K]> extends true
						? Record<string, any> | GetNullablePart<Props[K]>
						: TransformEmptyObject<FromSchema<TSchema>[K]>
				: TransformEmptyObject<FromSchema<TSchema>[K]>;
		}
	: never;

/**
 * Convert a LixSchemaDefinition to a TypeScript type.
 *
 * This type transformation:
 * 1. Converts JSON Schema properties to TypeScript types
 * 2. Wraps properties with `x-lix-generated: true` in LixGenerated markers
 * 3. Transforms `type: "object"` without properties to `Record<string, any>`
 *
 * The resulting type can be used with LixInsertable, LixUpdateable, and
 * LixSelectable for database operations.
 *
 * @example
 * ```typescript
 * const AccountSchema = {
 *   "x-lix-key": "account",
 *   "x-lix-version": "1.0",
 *   "x-lix-primary-key": ["/id"],
 *   type: "object",
 *   properties: {
 *     id: { type: "string", "x-lix-generated": true },
 *     name: { type: "string" },
 *     email: { type: "string" },
 *     metadata: { type: "object" },  // Becomes Record<string, any>
 *     created_at: { type: "string", "x-lix-generated": true }
 *   },
 *   required: ["id", "name", "email"],
 *   additionalProperties: false
 * } as const satisfies LixSchemaDefinition;
 *
 * type Account = FromLixSchemaDefinition<typeof AccountSchema>;
 * // Result: {
 * //   id: LixGenerated<string>;
 * //   name: string;
 * //   email: string;
 * //   metadata: Record<string, any> | undefined;
 * //   created_at: LixGenerated<string> | undefined;
 * // }
 * ```
 */
export type FromLixSchemaDefinition<T extends LixSchemaDefinition> =
	ApplyLixGenerated<T>;
