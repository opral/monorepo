import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { LixEngine } from "../../engine/boot.js";

export type StateByVersionView = {
	entity_id: string;
	schema_key: string;
	file_id: string;
	plugin_key: string;
	snapshot_content: Record<string, any>;
	schema_version: string;
	version_id: string;
	created_at: Generated<string>;
	updated_at: Generated<string>;
	inherited_from_version_id: string | null;
	change_id: Generated<string>;
	untracked: Generated<boolean>;
	commit_id: Generated<string>;
	writer_key: string | null;
	metadata: Generated<Record<string, any> | null>;
};

// Kysely operation types
export type StateByVersionRow = Selectable<StateByVersionView>;
export type NewStateByVersionRow = Insertable<StateByVersionView>;
export type StateByVersionRowUpdate = Updateable<StateByVersionView>;

/**
 * Creates the public state_by_version view (no tombstones) over the internal vtable,
 * plus INSTEAD OF triggers to forward writes to the internal vtable.
 */
export function applyStateByVersionView(args: {
	engine: Pick<LixEngine, "sqlite">;
}): void {
	args.engine.sqlite.exec(`
    CREATE VIEW IF NOT EXISTS state_by_version AS
    SELECT 
      entity_id,
      schema_key,
      file_id,
      version_id,
      plugin_key,
      snapshot_content,
      schema_version,
      created_at,
      updated_at,
      inherited_from_version_id,
      change_id,
      untracked,
      commit_id,
      writer_key,
      (
        SELECT json(metadata)
        FROM change
        WHERE change.id = lix_internal_state_vtable.change_id
      ) AS metadata
    FROM lix_internal_state_vtable
    WHERE snapshot_content IS NOT NULL;

    -- Forward writes on state_by_version to the internal vtable
    CREATE TRIGGER IF NOT EXISTS state_by_version_insert
    INSTEAD OF INSERT ON state_by_version
    BEGIN
      INSERT INTO lix_internal_state_vtable (
        entity_id,
        schema_key,
        file_id,
        version_id,
        plugin_key,
        snapshot_content,
        schema_version,
        metadata,
        untracked
      ) VALUES (
        NEW.entity_id,
        NEW.schema_key,
        NEW.file_id,
        NEW.version_id,
        NEW.plugin_key,
        NEW.snapshot_content,
        NEW.schema_version,
        NEW.metadata,
        COALESCE(NEW.untracked, 0)
      );

    END;

    CREATE TRIGGER IF NOT EXISTS state_by_version_update
    INSTEAD OF UPDATE ON state_by_version
    BEGIN
      UPDATE lix_internal_state_vtable
      SET
        entity_id = NEW.entity_id,
        schema_key = NEW.schema_key,
        file_id = NEW.file_id,
        version_id = NEW.version_id,
        plugin_key = NEW.plugin_key,
        snapshot_content = NEW.snapshot_content,
        schema_version = NEW.schema_version,
        metadata = NEW.metadata,
        untracked = COALESCE(NEW.untracked, 0)
      WHERE
        entity_id = OLD.entity_id AND
        schema_key = OLD.schema_key AND
        file_id = OLD.file_id AND
        version_id = OLD.version_id;

    END;

    CREATE TRIGGER IF NOT EXISTS state_by_version_delete
    INSTEAD OF DELETE ON state_by_version
    BEGIN
      DELETE FROM lix_internal_state_vtable
      WHERE
        entity_id = OLD.entity_id AND
        schema_key = OLD.schema_key AND
        file_id = OLD.file_id AND
        version_id = OLD.version_id;

    END;
  `);
}
