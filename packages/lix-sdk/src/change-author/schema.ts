import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import type { Lix } from "../lix/open-lix.js";

export function applyChangeAuthorDatabaseSchema(
	lix: Pick<Lix, "sqlite" | "db">
): void {
	// Create change_author view using the generalized entity view builder
	createEntityViewsIfNotExists({
		lix,
		schema: LixChangeAuthorSchema,
		overrideName: "change_author",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
	});
}

export const LixChangeAuthorSchema = {
	"x-lix-key": "lix_change_author",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["change_id", "account_id"],
	"x-lix-foreign-keys": {
		change_id: {
			schemaKey: "lix_change",
			property: "id",
		},
		account_id: {
			schemaKey: "lix_account",
			property: "id",
		},
	},
	type: "object",
	properties: {
		change_id: { type: "string" },
		account_id: { type: "string" },
	},
	required: ["change_id", "account_id"],
	additionalProperties: false,
} as const;
LixChangeAuthorSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type LixChangeAuthor = FromLixSchemaDefinition<
	typeof LixChangeAuthorSchema
>;
