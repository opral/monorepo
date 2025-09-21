import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../schema-definition/definition.js";

export type LixAccount = FromLixSchemaDefinition<typeof LixAccountSchema>;
export const LixAccountSchema = {
	"x-lix-key": "lix_account",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	type: "object",
	properties: {
		id: { type: "string", "x-lix-generated": true },
		name: { type: "string" },
	},
	required: ["id", "name"],
	additionalProperties: false,
} as const;
LixAccountSchema satisfies LixSchemaDefinition;

export type LixActiveAccount = FromLixSchemaDefinition<
	typeof LixActiveAccountSchema
>;

export const LixActiveAccountSchema = {
	"x-lix-key": "lix_active_account",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["account_id"],
	"x-lix-foreign-keys": [
		{
			properties: ["account_id"],
			references: {
				schemaKey: "lix_account",
				properties: ["id"],
			},
		},
	],
	type: "object",
	properties: {
		account_id: { type: "string" },
	},
	required: ["account_id"],
	additionalProperties: false,
} as const;
LixActiveAccountSchema satisfies LixSchemaDefinition;
