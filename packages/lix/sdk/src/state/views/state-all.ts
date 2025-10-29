import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { LixEngine } from "../../engine/boot.js";

export type StateAllView = {
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
export type StateAllRow = Selectable<StateAllView>;
export type NewStateAllRow = Insertable<StateAllView>;
export type StateAllRowUpdate = Updateable<StateAllView>;

/**
 * Creates the public state_all view (no tombstones) over the internal vtable,
 * plus INSTEAD OF triggers to forward writes to the internal vtable.
 */
export function applyStateAllView(args: {
	engine: Pick<LixEngine, "sqlite">;
}): void {
	args.engine.sqlite.exec(`
    CREATE VIEW IF NOT EXISTS state_all AS
    SELECT 
      v.entity_id,
      v.schema_key,
      v.file_id,
      v.version_id,
      v.plugin_key,
      v.snapshot_content,
      v.schema_version,
      v.created_at,
      v.updated_at,
      v.inherited_from_version_id,
      v.change_id,
      v.untracked,
      v.commit_id,
      v.writer_key,
      (
        SELECT json(metadata)
        FROM change
        WHERE change.id = v.change_id
      ) AS metadata
    FROM lix_internal_state_vtable AS v
    WHERE v.snapshot_content IS NOT NULL;

    -- Forward writes on state_all to the internal vtable
    CREATE TRIGGER IF NOT EXISTS state_all_insert
    INSTEAD OF INSERT ON state_all
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

      -- Invalidate file data cache for this file/version
      DELETE FROM lix_internal_file_data_cache
      WHERE file_id = NEW.file_id
        AND version_id = NEW.version_id;
    END;

    CREATE TRIGGER IF NOT EXISTS state_all_update
    INSTEAD OF UPDATE ON state_all
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

      -- Invalidate file data cache for this file/version
      DELETE FROM lix_internal_file_data_cache
      WHERE file_id = NEW.file_id
        AND version_id = NEW.version_id;
    END;

    CREATE TRIGGER IF NOT EXISTS state_all_delete
    INSTEAD OF DELETE ON state_all
    BEGIN
      DELETE FROM lix_internal_state_vtable
      WHERE
        entity_id = OLD.entity_id AND
        schema_key = OLD.schema_key AND
        file_id = OLD.file_id AND
        version_id = OLD.version_id;

      -- Invalidate file data cache for this file/version
      DELETE FROM lix_internal_file_data_cache
      WHERE file_id = OLD.file_id
        AND version_id = OLD.version_id;
    END;
  `);
}
