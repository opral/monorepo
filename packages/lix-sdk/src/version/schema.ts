import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import {
	createEntityViewsIfNotExists,
	type StateEntityView,
	type StateEntityAllView,
} from "../state/entity-view-builder.js";
import { nanoid } from "../database/nano-id.js";
import { humanId } from "human-id";

// initial ids (lack of having a separate creation and migration schema)
export const INITIAL_VERSION_ID = "BoIaHTW9ePX6pNc8";
export const INITIAL_CHANGE_SET_ID = "2j9jm90ajc9j90";
export const INITIAL_WORKING_CHANGE_SET_ID = "h2h09ha92jfaw2";
export const INITIAL_GLOBAL_VERSION_CHANGE_SET_ID = "23n0ajsf328ns";
export const INITIAL_GLOBAL_VERSION_WORKING_CHANGE_SET_ID = "om3290j08gj8j23";

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
			inherits_from_version_id: () => "global",
		},
	});

	// Create the active_version table (simple table - no change control needed)
	sqlite.exec(`
    CREATE TABLE IF NOT EXISTS active_version (
      version_id TEXT NOT NULL
    );
  `);
}

export function populateVersionRecords(sqlite: SqliteWasmDatabase): void {
	// Initialize database with required change sets and versions
	sqlite.exec(`
    -- Create change sets for global version if they don't exist
    INSERT OR IGNORE INTO change_set_all (id, lixcol_version_id) VALUES ('${INITIAL_GLOBAL_VERSION_CHANGE_SET_ID}', 'global');
    INSERT OR IGNORE INTO change_set_all (id, lixcol_version_id) VALUES ('${INITIAL_GLOBAL_VERSION_WORKING_CHANGE_SET_ID}', 'global');

    -- Create global version if it doesn't exist
    INSERT OR IGNORE INTO state (
      entity_id,
      schema_key,
      file_id,
      plugin_key,
      snapshot_content,
      schema_version,
      version_id
    ) VALUES (
      'global',
      'lix_version',
      'lix',
      'lix_own_entity',
      json_object(
        'id', 'global',
        'name', 'global',
        'change_set_id', '${INITIAL_GLOBAL_VERSION_CHANGE_SET_ID}',
        'working_change_set_id', '${INITIAL_GLOBAL_VERSION_WORKING_CHANGE_SET_ID}'
      ),
      '1.0',
      'global'
    );

    -- Create change set for default version if missing
    INSERT INTO change_set_all (id, lixcol_version_id)
    SELECT '${INITIAL_CHANGE_SET_ID}', 'global'
    WHERE NOT EXISTS (SELECT 1 FROM change_set_all WHERE id = '${INITIAL_CHANGE_SET_ID}');

    -- Insert the default working change set if missing
    INSERT INTO change_set_all (id, lixcol_version_id)
    SELECT '${INITIAL_WORKING_CHANGE_SET_ID}', 'global'
    WHERE NOT EXISTS (SELECT 1 FROM change_set_all WHERE id = '${INITIAL_WORKING_CHANGE_SET_ID}');

    -- Insert the default version if missing
    INSERT INTO state (
      entity_id, 
      schema_key, 
      file_id, 
      plugin_key, 
      snapshot_content, 
      schema_version,
      version_id
    )
    SELECT 
      '${INITIAL_VERSION_ID}', 
      'lix_version', 
      'lix', 
      'lix_own_entity', 
      json_object(
        'id', '${INITIAL_VERSION_ID}',                
        'name', 'main',            
        'change_set_id', '${INITIAL_CHANGE_SET_ID}',
        'working_change_set_id', '${INITIAL_WORKING_CHANGE_SET_ID}',
        'inherits_from_version_id', 'global'
      ),
      '${LixVersionSchema["x-lix-version"]}',
      'global'
    WHERE NOT EXISTS (
      SELECT 1 
      FROM state 
      WHERE entity_id = '${INITIAL_VERSION_ID}' 
      AND schema_key = 'lix_version'
    );

    -- Set the default current version to 'main' if active_version table is empty
    INSERT INTO active_version (version_id)
    SELECT '${INITIAL_VERSION_ID}'
    WHERE NOT EXISTS (SELECT 1 FROM active_version);
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
		id: { type: "string" },
		name: { type: "string" },
		change_set_id: { type: "string" },
		working_change_set_id: { type: "string" },
		inherits_from_version_id: { type: ["string", "null"] },
	},
	required: ["id", "name", "change_set_id", "working_change_set_id"],
	additionalProperties: false,
} as const;
LixVersionSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type LixVersion = FromLixSchemaDefinition<typeof LixVersionSchema>;

// Database view type (includes operational columns) - active version only
export type VersionView = {
	id: Generated<string>;
	name: Generated<string>;
	change_set_id: string;
	working_change_set_id: string;
	inherits_from_version_id: string | null;
} & StateEntityView;

// Database view type for cross-version operations
export type VersionAllView = {
	id: Generated<string>;
	name: Generated<string>;
	change_set_id: string;
	working_change_set_id: string;
	inherits_from_version_id: string | null;
} & StateEntityAllView;

// Kysely operation types
export type Version = Selectable<VersionView>;
export type NewVersion = Insertable<VersionView>;
export type VersionUpdate = Updateable<VersionView>;

// Simple table type for active_version (no schema needed - it's not change-controlled)
export type ActiveVersionTable = {
	version_id: string;
};

// Kysely operation types for the active_version table
export type ActiveVersion = Selectable<ActiveVersionTable>;
export type NewActiveVersion = Insertable<ActiveVersionTable>;
export type ActiveVersionUpdate = Updateable<ActiveVersionTable>;
