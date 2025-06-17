import type { Insertable, Selectable, Updateable } from "kysely";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import {
	createEntityViewsIfNotExists,
	type StateEntityView,
	type StateEntityAllView,
} from "../state/entity-view-builder.js";

export function applyChangeAuthorDatabaseSchema(
	sqlite: SqliteWasmDatabase
): void {
	// Create change_author view using the generalized entity view builder
	createEntityViewsIfNotExists({
		lix: { sqlite },
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
} as const;
LixChangeAuthorSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type LixChangeAuthor = FromLixSchemaDefinition<
	typeof LixChangeAuthorSchema
>;

// Database view type (includes operational columns) - active version only
export type ChangeAuthorView = {
	change_id: string;
	account_id: string;
} & StateEntityView;

// Database view type for cross-version operations
export type ChangeAuthorAllView = {
	change_id: string;
	account_id: string;
} & StateEntityAllView;

// Kysely operation types
export type ChangeAuthor = Selectable<ChangeAuthorView>;
export type NewChangeAuthor = Insertable<ChangeAuthorView>;
export type ChangeAuthorUpdate = Updateable<ChangeAuthorView>;
