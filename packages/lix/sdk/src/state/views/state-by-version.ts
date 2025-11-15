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

      -- Invalidate file data cache for this file/version
      DELETE FROM lix_internal_file_data_cache
      WHERE file_id = NEW.file_id
        AND version_id = NEW.version_id;

      -- Update file path cache for file descriptors
      INSERT OR REPLACE INTO lix_internal_file_path_cache (
        file_id,
        version_id,
        directory_id,
        name,
        extension,
        path
      )
      SELECT
        NEW.entity_id,
        NEW.version_id,
        file_fields.directory_id,
        file_fields.name,
        file_fields.extension,
        CASE
          WHEN file_fields.directory_id IS NULL THEN
            CASE
              WHEN file_fields.extension IS NULL OR file_fields.extension = ''
                THEN '/' || file_fields.name
              ELSE '/' || file_fields.name || '.' || file_fields.extension
            END
          ELSE
            CASE
              WHEN file_fields.extension IS NULL OR file_fields.extension = ''
                THEN COALESCE(dp.path, '/') || file_fields.name
              ELSE COALESCE(dp.path, '/') || file_fields.name || '.' || file_fields.extension
            END
        END AS resolved_path
      FROM (
        SELECT
          json_extract(NEW.snapshot_content, '$.directory_id') AS directory_id,
          json_extract(NEW.snapshot_content, '$.name') AS name,
          json_extract(NEW.snapshot_content, '$.extension') AS extension
      ) AS file_fields
      LEFT JOIN directory_by_version AS dp
        ON dp.id = file_fields.directory_id
       AND dp.lixcol_version_id = NEW.version_id
      WHERE NEW.schema_key = 'lix_file_descriptor'
        AND NEW.snapshot_content IS NOT NULL;

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

      -- Invalidate file data cache for this file/version
      DELETE FROM lix_internal_file_data_cache
      WHERE file_id = NEW.file_id
        AND version_id = NEW.version_id;

      -- Update file path cache for file descriptors
      INSERT OR REPLACE INTO lix_internal_file_path_cache (
        file_id,
        version_id,
        directory_id,
        name,
        extension,
        path
      )
      SELECT
        NEW.entity_id,
        NEW.version_id,
        file_fields.directory_id,
        file_fields.name,
        file_fields.extension,
        CASE
          WHEN file_fields.directory_id IS NULL THEN
            CASE
              WHEN file_fields.extension IS NULL OR file_fields.extension = ''
                THEN '/' || file_fields.name
              ELSE '/' || file_fields.name || '.' || file_fields.extension
            END
          ELSE
            CASE
              WHEN file_fields.extension IS NULL OR file_fields.extension = ''
                THEN COALESCE(dp.path, '/') || file_fields.name
              ELSE COALESCE(dp.path, '/') || file_fields.name || '.' || file_fields.extension
            END
        END AS resolved_path
      FROM (
        SELECT
          json_extract(NEW.snapshot_content, '$.directory_id') AS directory_id,
          json_extract(NEW.snapshot_content, '$.name') AS name,
          json_extract(NEW.snapshot_content, '$.extension') AS extension
      ) AS file_fields
      LEFT JOIN directory_by_version AS dp
        ON dp.id = file_fields.directory_id
       AND dp.lixcol_version_id = NEW.version_id
      WHERE NEW.schema_key = 'lix_file_descriptor'
        AND NEW.snapshot_content IS NOT NULL;

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

      -- Invalidate file data cache for this file/version
      DELETE FROM lix_internal_file_data_cache
      WHERE file_id = OLD.file_id
        AND version_id = OLD.version_id;

      -- Invalidate file path cache for this file/version
      DELETE FROM lix_internal_file_path_cache
      WHERE file_id = OLD.file_id
        AND version_id = OLD.version_id;
    END;
  `);
}
