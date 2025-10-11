import type {
	FromLixSchemaDefinition,
	LixInsertable,
	LixSchemaDefinition,
} from "../../schema-definition/index.js";

/**
 * Schema definition for deterministic mode options.
 *
 * @example
 * const options = {
 *   enabled: true,
 *   randomLixId: false,
 *   timestamp: true,
 *   random_seed: "default-seed",
 *   nano_id: true,
 *   uuid_v7: true
 * };
 */
export const LixDeterministicModeOptionsSchema = {
	"x-lix-key": "lix_deterministic_mode",
	"x-lix-version": "1.0",
	type: "object",
	properties: {
		enabled: {
			type: "boolean",
		},
		randomLixId: {
			type: "boolean",
			"x-lix-default": "false",
		},
		timestamp: {
			type: "boolean",
			"x-lix-default": "true",
		},
		random_seed: {
			type: "string",
			"x-lix-default": "'lix-deterministic-seed'",
		},
		nano_id: {
			type: "boolean",
			"x-lix-default": "true",
		},
		uuid_v7: {
			type: "boolean",
			"x-lix-default": "true",
		},
	},
	required: ["enabled"],
	additionalProperties: false,
} as const;

export type DeterministicModeOptions = LixInsertable<
	FromLixSchemaDefinition<typeof LixDeterministicModeOptionsSchema>
>;

LixDeterministicModeOptionsSchema satisfies LixSchemaDefinition;
