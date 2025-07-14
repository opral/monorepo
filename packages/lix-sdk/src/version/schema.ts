import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import { nanoId } from "../database/functions.js";
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
			id: () => nanoId({ lix: { sqlite } }),
			name: () => humanId(),
			working_change_set_id: () => nanoId({ lix: { sqlite } }),
			inherits_from_version_id: () => "global",
			hidden: () => false,
		},
	});

	// Create active_version as an entity view manually with untracked state
	sqlite.exec(`
		CREATE VIEW IF NOT EXISTS active_version AS
		SELECT
			json_extract(snapshot_content, '$.version_id') AS version_id,
			inherited_from_version_id AS lixcol_inherited_from_version_id,
			created_at AS lixcol_created_at,
			updated_at AS lixcol_updated_at,
			file_id AS lixcol_file_id,
			change_id AS lixcol_change_id,
			untracked AS lixcol_untracked
		FROM state_all
		WHERE schema_key = 'lix_active_version' AND version_id = 'global';

		CREATE TRIGGER IF NOT EXISTS active_version_insert
		INSTEAD OF INSERT ON active_version
		BEGIN
			INSERT INTO state_all (
				entity_id,
				schema_key,
				file_id,
				plugin_key,
				snapshot_content,
				schema_version,
				version_id,
				untracked
			) VALUES (
				'active',
				'lix_active_version',
				'lix',
				'lix_own_entity',
				json_object('version_id', NEW.version_id),
				'1.0',
				'global',
				1
			);
		END;

		CREATE TRIGGER IF NOT EXISTS active_version_update
		INSTEAD OF UPDATE ON active_version
		BEGIN
			UPDATE state_all
			SET
				snapshot_content = json_object('version_id', NEW.version_id),
				untracked = 1
			WHERE
				entity_id = 'active'
				AND schema_key = 'lix_active_version'
				AND version_id = 'global';
		END;

		CREATE TRIGGER IF NOT EXISTS active_version_delete
		INSTEAD OF DELETE ON active_version
		BEGIN
			DELETE FROM state_all
			WHERE entity_id = 'active'
			AND schema_key = 'lix_active_version'
			AND version_id = 'global';
		END;
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

export const LixActiveVersionSchema = {
	"x-lix-key": "lix_active_version",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["version_id"],
	"x-lix-foreign-keys": {
		version_id: {
			schemaKey: "lix_version",
			property: "id",
		},
	},
	type: "object",
	properties: {
		version_id: { type: "string" },
	},
	required: ["version_id"],
	additionalProperties: false,
} as const;
LixActiveVersionSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type LixVersion = FromLixSchemaDefinition<typeof LixVersionSchema>;
export type LixActiveVersion = FromLixSchemaDefinition<
	typeof LixActiveVersionSchema
>;
