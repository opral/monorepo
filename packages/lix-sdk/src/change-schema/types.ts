/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FromSchema, JSONSchema } from "json-schema-to-ts";

/**
 * Infers the snapshot content type from the schema.
 */
export type ExperimentalInferType<ChangeSchema> =
	// If the schema is a JSON schema and the schema is provided,
	ChangeSchema extends {
		type: "json";
		schema: JSONSchema;
	}
		? // infer the type from the schema.
			FromSchema<ChangeSchema["schema"]>
		: // else if the schema is a JSON schema and the schema is not provided,
			ChangeSchema extends { type: "json" }
			? // infer the type as any.
				any
			: // else if the schema is a blob schema,
				// infer the type as an ArrayBuffer.
				ChangeSchema extends { type: "blob" }
				? ArrayBuffer
				: // else infer the type as never.
					never;

/**
 * The schema of a detected change.
 *
 * The key is used to identify the schema. It is highly
 * recommended to use a unique key for each schema and
 * include a version number in the key when breaking
 * changes are made.
 *
 * - use `as const` to narrow the types
 * - use `... satisfies ChangeSchema` to get autocomplete
 *
 * @example
 *   const FooV1 = {
 *      key: "csv-plugin-foo-v1",
 *      type: "json",
 *      schema: jsonSchema,
 *   } as const satisfies ChangeSchema;
 */
export type ExperimentalChangeSchema =
	| {
			key: string;
			type: "json";
			schema: JSONSchema;
	  }
	| {
			key: string;
			type: "blob";
			schema?: undefined;
	  };
