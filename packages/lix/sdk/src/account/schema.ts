import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import type { LixEngine } from "../engine/boot.js";
import { nanoIdSync } from "../engine/functions/nano-id.js";

export function applyAccountDatabaseSchema(args: {
	engine: Pick<LixEngine, "sqlite" | "db" | "hooks">;
}): void {
	const { engine } = args;
	// Create account view using the generalized entity view builder
	createEntityViewsIfNotExists({
		engine,
		schema: LixAccountSchema,
		overrideName: "account",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: {
			id: () => nanoIdSync({ engine: engine }),
		},
	});

	// Create active_account as an entity view (similar to active_version)
	// Stores references to account IDs, joining with account table for details
	engine.sqlite.exec(`
		CREATE VIEW IF NOT EXISTS active_account AS
		SELECT
			json_extract(sa.snapshot_content, '$.account_id') AS account_id,
			sa.inherited_from_version_id AS lixcol_inherited_from_version_id,
			sa.created_at AS lixcol_created_at,
			sa.updated_at AS lixcol_updated_at,
			sa.file_id AS lixcol_file_id,
			sa.change_id AS lixcol_change_id,
			sa.untracked AS lixcol_untracked
		FROM state_all sa
		WHERE sa.schema_key = 'lix_active_account' AND sa.version_id = 'global';

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
				'active_' || NEW.account_id,
				'lix_active_account',
				'lix',
				'lix_own_entity',
				json_object('account_id', NEW.account_id),
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
				snapshot_content = json_object('account_id', NEW.account_id),
				untracked = 1
			WHERE
				entity_id = 'active_' || OLD.account_id
				AND schema_key = 'lix_active_account'
				AND version_id = 'global';
		END;

		CREATE TRIGGER IF NOT EXISTS active_account_delete
		INSTEAD OF DELETE ON active_account
		BEGIN
			DELETE FROM state_all
			WHERE entity_id = 'active_' || OLD.account_id
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

// Active account schema definition
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

// Active account type
export type LixActiveAccount = FromLixSchemaDefinition<
	typeof LixActiveAccountSchema
>;
