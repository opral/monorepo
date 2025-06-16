import type { Insertable, Selectable, Updateable, Generated } from "kysely";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export function applyChangeAuthorDatabaseSchema(
	sqlite: SqliteWasmDatabase
): void {
	sqlite.exec(`
		CREATE VIEW IF NOT EXISTS change_author AS
		SELECT
			json_extract(snapshot_content, '$.change_id') AS change_id,
			json_extract(snapshot_content, '$.account_id') AS account_id,
			version_id AS state_version_id,
			inherited_from_version_id AS state_inherited_from_version_id
		FROM state
		WHERE schema_key = 'lix_change_author';

		CREATE TRIGGER IF NOT EXISTS change_author_insert
		INSTEAD OF INSERT ON change_author
		BEGIN
			INSERT INTO state (
				entity_id,
				schema_key,
				file_id,
				plugin_key,
				snapshot_content,
				schema_version,
				version_id
			) VALUES (
				NEW.change_id || '::' || NEW.account_id,
				'lix_change_author',
				'lix',
				'lix_own_entity',
				json_object('change_id', NEW.change_id, 'account_id', NEW.account_id),
				'${LixChangeAuthorSchema["x-lix-version"]}',
				COALESCE(NEW.state_version_id, (SELECT version_id FROM active_version))
			);
		END;

		CREATE TRIGGER IF NOT EXISTS change_author_update
		INSTEAD OF UPDATE ON change_author
		BEGIN
			UPDATE state
			SET
				entity_id = NEW.change_id || '::' || NEW.account_id,
				schema_key = 'lix_change_author',
				file_id = 'lix',
				plugin_key = 'lix_own_entity',
				snapshot_content = json_object('change_id', NEW.change_id, 'account_id', NEW.account_id),
				version_id = COALESCE(NEW.state_version_id, OLD.state_version_id)
			WHERE entity_id = OLD.change_id || '::' || OLD.account_id
				AND schema_key = 'lix_change_author'
				AND version_id = OLD.state_version_id;
		END;

		CREATE TRIGGER IF NOT EXISTS change_author_delete
		INSTEAD OF DELETE ON change_author
		BEGIN
			DELETE FROM state
			WHERE entity_id = OLD.change_id || '::' || OLD.account_id
				AND schema_key = 'lix_change_author'
				AND version_id = OLD.state_version_id;
		END;
	`);
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

// Database view type (includes operational columns)
export type ChangeAuthorView = {
	change_id: string;
	account_id: string;
	state_version_id: Generated<string>;
	state_inherited_from_version_id: Generated<string | null>;
};

// Kysely operation types
export type ChangeAuthor = Selectable<ChangeAuthorView>;
export type NewChangeAuthor = Insertable<ChangeAuthorView>;
export type ChangeAuthorUpdate = Updateable<ChangeAuthorView>;
