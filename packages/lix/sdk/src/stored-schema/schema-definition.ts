import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../schema-definition/definition.js";
import { JSONTypeSchema } from "../schema-definition/json-type.js";

export type LixStoredSchema = FromLixSchemaDefinition<
	typeof LixStoredSchemaSchema
> & {
	value: any;
};

export const LixStoredSchemaSchema = {
	"x-lix-key": "lix_stored_schema",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["key", "version"],
	type: "object",
	properties: {
		key: { type: "string", "x-lix-generated": true },
		version: { type: "string", "x-lix-generated": true },
		value: JSONTypeSchema as any,
	},
	additionalProperties: false,
} as const;
LixStoredSchemaSchema satisfies LixSchemaDefinition;
