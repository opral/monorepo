import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../schema-definition/definition.js";
import { JSONTypeSchema } from "../schema-definition/json-type.js";

export type LixLog = FromLixSchemaDefinition<typeof LixLogSchema>;

export const LixLogSchema = {
	"x-lix-key": "lix_log",
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
			description: "The unique identifier of the log entry",
			"x-lix-generated": true,
			"x-lix-default": "lix_uuid_v7()",
		},
		key: {
			type: "string",
			description: "The key of the log entry",
		},
		message: {
			type: "string",
			description: "The message of the log entry",
			nullable: true,
		},
		payload: {
			...JSONTypeSchema,
			description: "Structured payload for the log entry",
		} as any,
		level: {
			type: "string",
			description: "The level of the log entry",
		},
	},
	required: ["id", "key", "level"],
	additionalProperties: false,
} as const;
LixLogSchema satisfies LixSchemaDefinition;
