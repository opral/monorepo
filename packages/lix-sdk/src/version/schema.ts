import type { Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import { nanoid } from "../database/nano-id.js";
import { humanId } from "human-id";

export function applyVersionDatabaseSchema(sqlite: SqliteWasmDatabase): void {
	// Create both primary and _all views for version with global version constraint
	createEntityViewsIfNotExists({
		lix: { sqlite },
		schema: LixVersionSchema,
		overrideName: "version",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		hardcodedVersionId: "global",
		defaultValues: {
			id: () => nanoid(),
			name: () => humanId(),
			working_change_set_id: () => nanoid(),
			inherits_from_version_id: () => "global",
			hidden: () => false,
		},
	});

	// Create the active_version table (simple table - no change control needed)
	sqlite.exec(`
    CREATE TABLE IF NOT EXISTS active_version (
      version_id TEXT NOT NULL
    );
  `);
}

export const LixVersionSchema = {
	"x-lix-key": "lix_version",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	"x-lix-unique": [["working_change_set_id"]],
	"x-lix-foreign-keys": {
		change_set_id: {
			schemaKey: "lix_change_set",
			property: "id",
		},
		working_change_set_id: {
			schemaKey: "lix_change_set",
			property: "id",
		},
		inherits_from_version_id: {
			schemaKey: "lix_version",
			property: "id",
		},
	},
	type: "object",
	properties: {
		id: { type: "string", "x-lix-generated": true },
		name: { type: "string", "x-lix-generated": true },
		change_set_id: { type: "string" },
		working_change_set_id: { type: "string", "x-lix-generated": true },
		inherits_from_version_id: {
			type: ["string", "null"],
			"x-lix-generated": true,
		},
		hidden: { type: "boolean", "x-lix-generated": true },
	},
	required: ["id", "name", "change_set_id", "working_change_set_id"],
	additionalProperties: false,
} as const;
LixVersionSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type Version = FromLixSchemaDefinition<typeof LixVersionSchema>;

// Simple table type for active_version (no schema needed - it's not change-controlled)
export type ActiveVersionTable = {
	version_id: string;
};

// Kysely operation types for the active_version table
export type ActiveVersion = Selectable<ActiveVersionTable>;
export type NewActiveVersion = Insertable<ActiveVersionTable>;
export type ActiveVersionUpdate = Updateable<ActiveVersionTable>;
