import type { LixEngine } from "../engine/boot.js";
import {
	LixVersionDescriptorSchema,
	LixVersionTipSchema,
	LixActiveVersionSchema,
	type LixVersionDescriptor,
	type LixVersionTip,
	type LixActiveVersion,
	type LixVersion,
} from "./schema-definition.js";

export {
	LixVersionDescriptorSchema,
	LixVersionTipSchema,
	LixActiveVersionSchema,
	type LixVersionDescriptor,
	type LixVersionTip,
	type LixActiveVersion,
	type LixVersion,
} from "./schema-definition.js";

export function applyVersionDatabaseSchema(args: {
	engine: Pick<LixEngine, "sqlite">;
}): void {
	// 2) Composite "version" view that merges descriptor + tip into a single projection
	// No backward-compat combined rows. The merged view exposes schema_key logically as 'lix_version'.
	args.engine.sqlite.exec(`
        CREATE VIEW IF NOT EXISTS version AS
        WITH descriptor AS (
            SELECT 
                json_extract(snapshot_content, '$.id') AS id,
                json_extract(snapshot_content, '$.name') AS name,
                json_extract(snapshot_content, '$.inherits_from_version_id') AS inherits_from_version_id,
                json_extract(snapshot_content, '$.hidden') AS hidden,
                entity_id AS lixcol_entity_id,
                file_id AS lixcol_file_id,
                plugin_key AS lixcol_plugin_key,
                schema_version AS lixcol_schema_version,
                change_id AS d_change_id,
                created_at AS d_created_at,
                updated_at AS d_updated_at,
                commit_id AS d_commit_id
            FROM state_all s
            WHERE s.schema_key = 'lix_version_descriptor' AND s.version_id = 'global'
              AND s.updated_at = (
                SELECT MAX(updated_at)
                FROM state_all s2
                WHERE s2.schema_key = 'lix_version_descriptor'
                  AND s2.version_id = 'global'
                  AND s2.entity_id = s.entity_id
              )
              AND s.change_id = (
                SELECT MAX(change_id)
                FROM state_all s3
                WHERE s3.schema_key = 'lix_version_descriptor'
                  AND s3.version_id = 'global'
                  AND s3.entity_id = s.entity_id
                  AND s3.updated_at = s.updated_at
              )
        ),
        tip AS (
            SELECT 
                json_extract(snapshot_content, '$.id') AS id,
                json_extract(snapshot_content, '$.commit_id') AS commit_id,
                json_extract(snapshot_content, '$.working_commit_id') AS working_commit_id,
                change_id AS t_change_id,
                created_at AS t_created_at,
                updated_at AS t_updated_at,
                commit_id AS t_commit_id
            FROM state_all s
            WHERE s.schema_key = 'lix_version_tip' AND s.version_id = 'global'
              AND s.updated_at = (
                SELECT MAX(updated_at)
                FROM state_all s2
                WHERE s2.schema_key = 'lix_version_tip'
                  AND s2.version_id = 'global'
                  AND s2.entity_id = s.entity_id
              )
              AND s.change_id = (
                SELECT MAX(change_id)
                FROM state_all s3
                WHERE s3.schema_key = 'lix_version_tip'
                  AND s3.version_id = 'global'
                  AND s3.entity_id = s.entity_id
                  AND s3.updated_at = s.updated_at
              )
        )
        SELECT 
            d.id,
            d.name,
            t.commit_id,
            t.working_commit_id AS working_commit_id,
            d.inherits_from_version_id,
            d.hidden,
            d.lixcol_entity_id,
            'lix_version' AS lixcol_schema_key,
            d.lixcol_file_id,
            NULL AS lixcol_inherited_from_version_id,
            COALESCE(t.t_change_id, d.d_change_id) AS lixcol_change_id,
            MIN(COALESCE(d.d_created_at, t.t_created_at), COALESCE(t.t_created_at, d.d_created_at)) AS lixcol_created_at,
            COALESCE(t.t_updated_at, d.d_updated_at) AS lixcol_updated_at,
            COALESCE(t.commit_id, d.d_commit_id) AS lixcol_commit_id,
            0 AS lixcol_untracked
        FROM descriptor d 
        LEFT JOIN tip t ON t.id = d.id;

        CREATE VIEW IF NOT EXISTS version_all AS
        WITH descriptor AS (
            SELECT 
                json_extract(snapshot_content, '$.id') AS id,
                json_extract(snapshot_content, '$.name') AS name,
                json_extract(snapshot_content, '$.inherits_from_version_id') AS inherits_from_version_id,
                json_extract(snapshot_content, '$.hidden') AS hidden,
                entity_id AS lixcol_entity_id,
                file_id AS lixcol_file_id,
                plugin_key AS lixcol_plugin_key,
                schema_version AS lixcol_schema_version,
                version_id AS lixcol_version_id,
                inherited_from_version_id AS lixcol_inherited_from_version_id,
                change_id AS d_change_id,
                created_at AS d_created_at,
                updated_at AS d_updated_at,
                commit_id AS d_commit_id
            FROM state_all s
            WHERE s.schema_key = 'lix_version_descriptor'
              AND s.updated_at = (
                SELECT MAX(updated_at)
                FROM state_all s2
                WHERE s2.schema_key = 'lix_version_descriptor'
                  AND s2.entity_id = s.entity_id
                  AND s2.version_id = s.version_id
              )
              AND s.change_id = (
                SELECT MAX(change_id)
                FROM state_all s3
                WHERE s3.schema_key = 'lix_version_descriptor'
                  AND s3.entity_id = s.entity_id
                  AND s3.version_id = s.version_id
                  AND s3.updated_at = s.updated_at
              )
        ),
        tip AS (
            SELECT 
                json_extract(snapshot_content, '$.id') AS id,
                json_extract(snapshot_content, '$.commit_id') AS commit_id,
                json_extract(snapshot_content, '$.working_commit_id') AS working_commit_id,
                version_id AS lixcol_version_id,
                change_id AS t_change_id,
                created_at AS t_created_at,
                updated_at AS t_updated_at,
                commit_id AS t_commit_id
            FROM state_all s
            WHERE s.schema_key = 'lix_version_tip'
              AND s.updated_at = (
                SELECT MAX(updated_at)
                FROM state_all s2
                WHERE s2.schema_key = 'lix_version_tip'
                  AND s2.entity_id = s.entity_id
                  AND s2.version_id = s.version_id
              )
              AND s.change_id = (
                SELECT MAX(change_id)
                FROM state_all s3
                WHERE s3.schema_key = 'lix_version_tip'
                  AND s3.entity_id = s.entity_id
                  AND s3.version_id = s.version_id
                  AND s3.updated_at = s.updated_at
              )
        )
        SELECT 
            d.id,
            d.name,
            t.commit_id,
            t.working_commit_id AS working_commit_id,
            d.inherits_from_version_id,
            d.hidden,
            d.lixcol_entity_id,
            'lix_version' AS lixcol_schema_key,
            d.lixcol_file_id,
            d.lixcol_plugin_key,
            d.lixcol_schema_version,
            d.lixcol_version_id,
            d.lixcol_inherited_from_version_id,
            COALESCE(t.t_change_id, d.d_change_id) AS lixcol_change_id,
            MIN(COALESCE(d.d_created_at, t.t_created_at), COALESCE(t.t_created_at, d.d_created_at)) AS lixcol_created_at,
            COALESCE(t.t_updated_at, d.d_updated_at) AS lixcol_updated_at,
            COALESCE(t.commit_id, d.d_commit_id) AS lixcol_commit_id,
            0 AS lixcol_untracked
        FROM descriptor d 
        LEFT JOIN tip t ON t.id = d.id AND t.lixcol_version_id = d.lixcol_version_id;

        -- Keep history view for typing completeness; may be sparsely populated until
        -- all writers route combined rows, which we are phasing out.
        CREATE VIEW IF NOT EXISTS version_history AS
        SELECT 
            json_extract(snapshot_content, '$.id') AS id,
            json_extract(snapshot_content, '$.name') AS name,
            json_extract(snapshot_content, '$.commit_id') AS commit_id,
            json_extract(snapshot_content, '$.working_commit_id') AS working_commit_id,
            json_extract(snapshot_content, '$.inherits_from_version_id') AS inherits_from_version_id,
            json_extract(snapshot_content, '$.hidden') AS hidden,
            entity_id AS lixcol_entity_id,
            file_id AS lixcol_file_id,
            plugin_key AS lixcol_plugin_key,
            schema_version AS lixcol_schema_version,
            change_id AS lixcol_change_id,
            commit_id AS lixcol_commit_id
        FROM state_history
        WHERE schema_key = 'lix_version';

        -- Triggers to route writes on version view through version_all (global scope)
        CREATE TRIGGER IF NOT EXISTS version_insert
        INSTEAD OF INSERT ON version
        BEGIN

            -- Route creation via version_all (global scope). The version_all_insert trigger
            -- will take care of writing descriptor + tip rows.
            INSERT INTO version_all (
                id,
                name,
                working_commit_id,
                inherits_from_version_id,
                hidden,
                lixcol_version_id,
                commit_id
            ) VALUES (
                NEW.id,
                NEW.name,
                NEW.working_commit_id,
                NEW.inherits_from_version_id,
                NEW.hidden,
                'global',
                NEW.commit_id
            );

        END;

        CREATE TRIGGER IF NOT EXISTS version_update
        INSTEAD OF UPDATE ON version
        BEGIN
            -- Route updates via version_all (global scope). The version_all_update trigger
            -- will update descriptor fields and move the tip when commit_id is provided.
            UPDATE version_all
            SET
                name = NEW.name,
                working_commit_id = NEW.working_commit_id,
                inherits_from_version_id = NEW.inherits_from_version_id,
                hidden = NEW.hidden,
                commit_id = NEW.commit_id
            WHERE id = NEW.id
              AND lixcol_version_id = 'global';

        END;

        CREATE TRIGGER IF NOT EXISTS version_delete
        INSTEAD OF DELETE ON version
        BEGIN
            -- Route deletes via version_all (global scope); version_all_delete handles state
            DELETE FROM version_all
            WHERE id = OLD.id
              AND lixcol_version_id = 'global';
        END;

        -- Write-capable version_all triggers mirroring 'version' but honoring explicit lixcol_version_id
        CREATE TRIGGER IF NOT EXISTS version_all_insert
        INSTEAD OF INSERT ON version_all
        BEGIN
            -- Always write descriptor row
            INSERT INTO state_all (
                entity_id, schema_key, file_id, plugin_key, snapshot_content, schema_version, version_id
            ) 
            SELECT 
                gen_id,
                'lix_version_descriptor',
                'lix',
                'lix_own_entity',
                json_object(
                    'id', gen_id,
                    'name', COALESCE(NEW.name, human_id()),
                    'inherits_from_version_id', NEW.inherits_from_version_id,
                    'hidden', COALESCE(NEW.hidden, 0)
                ),
                '1.0',
                COALESCE(NEW.lixcol_version_id, 'global')
            FROM (SELECT COALESCE(NEW.id, lix_nano_id()) AS gen_id);

            -- Also write tip row: use NEW.commit_id if provided, otherwise default to parent's current tip
            INSERT INTO state_all (
                entity_id, schema_key, file_id, plugin_key, snapshot_content, schema_version, version_id
            )
            SELECT
                gen_id,
                'lix_version_tip',
                'lix',
                'lix_own_entity',
                json_object(
                    'id', gen_id,
                    'commit_id', tip_cid,
                    'working_commit_id', COALESCE(NEW.working_commit_id, tip_cid)
                ),
                '1.0',
                COALESCE(NEW.lixcol_version_id, 'global')
            FROM (
                SELECT 
                  COALESCE(NEW.id, lix_nano_id()) AS gen_id,
                  COALESCE(
                    NEW.commit_id,
                    (
                      SELECT commit_id FROM version 
                      WHERE id = COALESCE(NEW.inherits_from_version_id, 'global')
                      LIMIT 1
                    )
                  ) AS tip_cid
            )
            WHERE tip_cid IS NOT NULL;

        END;

        CREATE TRIGGER IF NOT EXISTS version_all_update
        INSTEAD OF UPDATE ON version_all
        BEGIN
            -- Route descriptor updates via UPDATE (fields are coalesced from current values)
            UPDATE state_all
            SET 
                file_id = 'lix',
                plugin_key = 'lix_own_entity',
                snapshot_content = json_object(
                    'id', NEW.id,
                    'name', COALESCE(NEW.name, (SELECT name FROM version WHERE id = NEW.id)),
                    'inherits_from_version_id', NEW.inherits_from_version_id,
                    'hidden', COALESCE(NEW.hidden, (SELECT hidden FROM version WHERE id = NEW.id))
                ),
                schema_version = '1.0',
                version_id = COALESCE(NEW.lixcol_version_id, 'global')
            WHERE entity_id = NEW.id
              AND schema_key = 'lix_version_descriptor'
              AND file_id = 'lix'
              AND version_id = COALESCE(NEW.lixcol_version_id, 'global');

            -- If a new commit_id is provided, update the tip pointer for the scoped version id
            UPDATE state_all
            SET 
                file_id = 'lix',
                plugin_key = 'lix_own_entity',
                snapshot_content = json_object(
                    'id', NEW.id,
                    'commit_id', NEW.commit_id,
                    'working_commit_id', COALESCE(
                        NEW.working_commit_id,
                        (SELECT working_commit_id FROM version WHERE id = NEW.id)
                    )
                ),
                schema_version = '1.0',
                version_id = COALESCE(NEW.lixcol_version_id, 'global')
            WHERE NEW.commit_id IS NOT NULL
              AND NEW.commit_id <> (SELECT commit_id FROM version WHERE id = NEW.id)
              AND entity_id = NEW.id
              AND schema_key = 'lix_version_tip'
              AND file_id = 'lix'
              AND version_id = COALESCE(NEW.lixcol_version_id, 'global');

        END;

        CREATE TRIGGER IF NOT EXISTS version_all_delete
        INSTEAD OF DELETE ON version_all
        BEGIN
            -- Route deletes via state_all (vtable handles tombstones)
            DELETE FROM state_all
            WHERE entity_id = OLD.id
              AND schema_key = 'lix_version_descriptor'
              AND file_id = 'lix'
              AND version_id = COALESCE(OLD.lixcol_version_id, 'global');

            DELETE FROM state_all
            WHERE entity_id = OLD.id
              AND schema_key = 'lix_version_tip'
              AND file_id = 'lix'
              AND version_id = COALESCE(OLD.lixcol_version_id, 'global');
        END;
    `);

	// This is a fallback for SQLite subquery's that run
	// as part of a DML trigger and are not (yet) preprocessed
	// in the lix engine. The view purposefully bypasses the vtable
	// to let SQLite's query planner optimize the query.
	args.engine.sqlite.exec(`
		CREATE VIEW IF NOT EXISTS active_version AS
		SELECT
			json_extract(snapshot_content, '$.version_id') AS version_id
		FROM lix_internal_state_all_untracked
		WHERE schema_key = 'lix_active_version' AND version_id = 'global';
	`);
}

// Logical schema for merged version view (typing + JSON column mapping)
// Note: merged 'version' is a view, not a writable schema entity

// Pure business logic type for merged version view
