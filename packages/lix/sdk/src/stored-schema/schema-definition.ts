import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../schema-definition/definition.js";
import { JSONTypeSchema } from "../schema-definition/json-type.js";

export type LixStoredSchema = FromLixSchemaDefinition<
	typeof LixStoredSchemaSchema
> & {
	value: LixSchemaDefinition;
};

export const LixStoredSchemaSchema = {
	"x-lix-key": "lix_stored_schema",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/value/x-lix-key", "/value/x-lix-version"],
	"x-lix-immutable": true,
	"x-lix-defaults": {
		lixcol_file_id: "lix",
		lixcol_plugin_key: "lix_own_entity",
	},
	type: "object",
	properties: {
		value: JSONTypeSchema as any,
	},
	required: ["value"],
	additionalProperties: false,
} as const;
LixStoredSchemaSchema satisfies LixSchemaDefinition;
