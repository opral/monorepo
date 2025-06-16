import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { LixSchemaDefinition, FromLixSchemaDefinition } from "../schema-definition/definition.js";
import type { Lix } from "../lix/open-lix.js";
import { humanId } from "human-id";

export function applyAccountDatabaseSchema(
	lix: Pick<Lix, "sqlite" | "db" | "plugin">
): void {
	const anonymousAccountName = `Anonymous ${humanId({
		capitalize: true,
		adjectiveCount: 0,
		separator: "_",
	})
		// Human ID has two words, remove the last one
		.split("_")[0]!
		// Human ID uses plural, remove the last character to make it singular
		.slice(0, -1)}`;

	lix.sqlite.exec(`
  CREATE VIEW IF NOT EXISTS account AS
	SELECT
		json_extract(snapshot_content, '$.id') AS id,
		json_extract(snapshot_content, '$.name') AS name,
		version_id AS state_version_id,
		inherited_from_version_id AS state_inherited_from_version_id
	FROM state
	WHERE schema_key = 'lix_account';

  CREATE TRIGGER IF NOT EXISTS account_insert
  INSTEAD OF INSERT ON account
  BEGIN
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
      with_default_values.id,
      'lix_account',
      'lix',
      'lix_own_entity',
      json_object('id', with_default_values.id, 'name', with_default_values.name),
      '${LixAccountSchema["x-lix-version"]}',
      COALESCE(NEW.state_version_id, (SELECT version_id FROM active_version))
    FROM (
      SELECT
        COALESCE(NEW.id, nano_id()) AS id,
        NEW.name AS name
    ) AS with_default_values;
  END;

  CREATE TRIGGER IF NOT EXISTS account_update
  INSTEAD OF UPDATE ON account
  BEGIN
    UPDATE state
    SET
      entity_id = NEW.id,
      schema_key = 'lix_account',
      file_id = 'lix',
      plugin_key = 'lix_own_entity',
      snapshot_content = json_object('id', NEW.id, 'name', NEW.name),
      version_id = COALESCE(NEW.state_version_id, OLD.state_version_id)
    WHERE entity_id = OLD.id
      AND schema_key = 'lix_account'
      AND version_id = OLD.state_version_id;
  END;

  CREATE TRIGGER IF NOT EXISTS account_delete
  INSTEAD OF DELETE ON account
  BEGIN
    DELETE FROM state
    WHERE entity_id = OLD.id
      AND schema_key = 'lix_account'
      AND version_id = OLD.state_version_id;
  END;

  -- current account(s)
  -- temp table because current accounts are session
  -- specific and should not be persisted
  CREATE TEMP TABLE IF NOT EXISTS active_account (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
    -- can't use foreign keys in temp tables... :(
  ) STRICT;

  -- default to a new account
  INSERT INTO active_account (id, name) values (nano_id(), '${anonymousAccountName}');
`);
}

export const LixAccountSchema = {
	"x-lix-key": "lix_account",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	type: "object",
	properties: {
		id: { type: "string" },
		name: { type: "string" },
	},
	required: ["id", "name"],
} as const;
LixAccountSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type LixAccount = FromLixSchemaDefinition<typeof LixAccountSchema>;

// Database view type (includes operational columns)
export type AccountView = {
	id: Generated<string>;
	name: string;
	state_version_id: Generated<string>;
	state_inherited_from_version_id: Generated<string | null>;
};

// Kysely operation types
export type Account = Selectable<AccountView>;
export type NewAccount = Insertable<AccountView>;
export type AccountUpdate = Updateable<AccountView>;

// Active account table type (temp table)
export type ActiveAccountTable = {
	id: string;
	name: string;
};

export type ActiveAccount = Selectable<ActiveAccountTable>;
export type NewActiveAccount = Insertable<ActiveAccountTable>;
export type ActiveAccountUpdate = Updateable<ActiveAccountTable>;