import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { nanoId } from "../database/index.js";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export function applyAccountDatabaseSchema(sqlite: SqliteWasmDatabase): void {
	// Create account view using the generalized entity view builder
	createEntityViewsIfNotExists({
		lix: { sqlite },
		schema: LixAccountSchema,
		overrideName: "account",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: {
			id: () => nanoId({ lix: { sqlite } }),
		},
	});

	// Create active_account as an entity view (similar to active_version)
	// entity_id is the account id to support multiple active accounts
	sqlite.exec(`
		CREATE VIEW IF NOT EXISTS active_account AS
		SELECT
			entity_id AS id,
			json_extract(snapshot_content, '$.name') AS name,
			inherited_from_version_id AS lixcol_inherited_from_version_id,
			created_at AS lixcol_created_at,
			updated_at AS lixcol_updated_at,
			file_id AS lixcol_file_id,
			change_id AS lixcol_change_id,
			untracked AS lixcol_untracked
		FROM state_all
		WHERE schema_key = 'lix_active_account' AND version_id = 'global';

		CREATE TRIGGER IF NOT EXISTS active_account_insert
		INSTEAD OF INSERT ON active_account
		BEGIN
			INSERT OR REPLACE INTO state_all (
				entity_id,
				schema_key,
				file_id,
				plugin_key,
				snapshot_content,
				schema_version,
				version_id,
				untracked
			) VALUES (
				NEW.id,
				'lix_active_account',
				'lix',
				'lix_own_entity',
				json_object('name', NEW.name),
				'1.0',
				'global',
				1
			);
		END;

		CREATE TRIGGER IF NOT EXISTS active_account_update
		INSTEAD OF UPDATE ON active_account
		BEGIN
			UPDATE state_all
			SET
				snapshot_content = json_object('name', NEW.name),
				untracked = 1
			WHERE
				entity_id = OLD.id
				AND schema_key = 'lix_active_account'
				AND version_id = 'global';
		END;

		CREATE TRIGGER IF NOT EXISTS active_account_delete
		INSTEAD OF DELETE ON active_account
		BEGIN
			DELETE FROM state_all
			WHERE entity_id = OLD.id
			AND schema_key = 'lix_active_account'
			AND version_id = 'global';
		END;
	`);
}

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

// Pure business logic type (inferred from schema)
export type LixAccount = FromLixSchemaDefinition<typeof LixAccountSchema>;

// Active account type using State
export type LixActiveAccount = LixAccount;
