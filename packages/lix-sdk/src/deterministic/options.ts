import type {
	FromLixSchemaDefinition,
	LixInsertable,
	LixSchemaDefinition,
} from "../schema-definition/index.js";

/**
 * Schema definition for deterministic mode options.
 *
 * @example
 * const options = {
 *   enabled: true,
 *   bootstrap: false,
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
		bootstrap: {
			type: "boolean",
			default: false,
			"x-lix-generated": true,
		},
		timestamp: {
			type: "boolean",
			default: true,
			"x-lix-generated": true,
		},
		random_seed: {
			type: "string",
			default: "lix-deterministic-seed",
			"x-lix-generated": true,
		},
		nano_id: {
			type: "boolean",
			default: true,
			"x-lix-generated": true,
		},
		uuid_v7: {
			type: "boolean",
			default: true,
			"x-lix-generated": true,
		},
	},
	required: ["enabled"],
	additionalProperties: false,
} as const;

export type DeterministicModeOptions = LixInsertable<
	FromLixSchemaDefinition<typeof LixDeterministicModeOptionsSchema>
>;

LixDeterministicModeOptionsSchema satisfies LixSchemaDefinition;
