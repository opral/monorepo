import type { Insertable, Selectable, Updateable } from "kysely";
import type { Lix } from "../../lix/open-lix.js";
import type { StateAllView } from "./state-all.js";

export type StateView = Omit<StateAllView, "version_id">;

// Kysely operation types
export type StateRow = Selectable<StateView>;
export type NewStateRow = Insertable<StateView>;
export type StateRowUpdate = Updateable<StateView>;

/**
 * Creates the public 'state' view filtered to the active version, and
 * INSTEAD OF triggers that forward writes to state_all (which proxies to the vtable).
 */
export function applyStateView(lix: Pick<Lix, "sqlite">): void {
	lix.sqlite.exec(`
    CREATE VIEW IF NOT EXISTS state AS
    SELECT 
      entity_id,
      schema_key,
      file_id,
      plugin_key,
      snapshot_content,
      schema_version,
      created_at,
      updated_at,
      inherited_from_version_id,
      change_id,
      untracked,
      commit_id
    FROM state_all
    WHERE version_id IN (SELECT version_id FROM active_version);

    -- Forward writes to the active version via state_all
    CREATE TRIGGER IF NOT EXISTS state_insert
    INSTEAD OF INSERT ON state
    BEGIN
      INSERT INTO state_all (
        entity_id,
        schema_key,
        file_id,
        version_id,
        plugin_key,
        snapshot_content,
        schema_version,
        untracked
      ) VALUES (
        NEW.entity_id,
        NEW.schema_key,
        NEW.file_id,
        (SELECT version_id FROM active_version),
        NEW.plugin_key,
        NEW.snapshot_content,
        NEW.schema_version,
        COALESCE(NEW.untracked, 0)
      );
    END;

    CREATE TRIGGER IF NOT EXISTS state_update
    INSTEAD OF UPDATE ON state
    BEGIN
      UPDATE state_all
      SET
        entity_id = NEW.entity_id,
        schema_key = NEW.schema_key,
        file_id = NEW.file_id,
        version_id = (SELECT version_id FROM active_version),
        plugin_key = NEW.plugin_key,
        snapshot_content = NEW.snapshot_content,
        schema_version = NEW.schema_version,
        untracked = COALESCE(NEW.untracked, 0)
      WHERE
        entity_id = OLD.entity_id
        AND schema_key = OLD.schema_key
        AND file_id = OLD.file_id
        AND version_id = (SELECT version_id FROM active_version);
    END;

    CREATE TRIGGER IF NOT EXISTS state_delete
    INSTEAD OF DELETE ON state
    BEGIN
      DELETE FROM state_all
      WHERE 
        entity_id = OLD.entity_id
        AND schema_key = OLD.schema_key
        AND file_id = OLD.file_id
        AND version_id = (SELECT version_id FROM active_version);
    END;
  `);
}
