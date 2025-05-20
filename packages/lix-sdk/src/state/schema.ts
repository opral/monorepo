import type { Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { validateSnapshotContent } from "./validate-snapshot-content.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import type { Kysely } from "kysely";
import type { JSONType } from "../schema-definition/json-type.js";
import { handleStateMutation } from "./handle-state-mutation.js";

export function applyStateDatabaseSchema(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>
): SqliteWasmDatabase {
	sqlite.createFunction({
		name: "validate_snapshot_content",
		deterministic: true,
		arity: 2,
		// @ts-expect-error - type mismatch
		xFunc: (_ctxPtr: number, ...args: any[]) => {
			return validateSnapshotContent({
				lix: { sqlite, db: db as any },
				schema: JSON.parse(args[0]),
				snapshot_content: JSON.parse(args[1]),
			});
		},
	});

	sqlite.createFunction({
		name: "handle_state_mutation",
		arity: -1,
		xFunc: (_ctxPtr: number, ...args: any[]) => {
			return handleStateMutation(
				sqlite,
				db,
				args[0], // entity_id
				args[1], // schema_key
				args[2], // file_id
				args[3], // plugin_key
				args[4] // snapshot_content
			);
		},
	});

	const sql = `
  CREATE VIEW IF NOT EXISTS state AS
  WITH
    /* 0. Base data: the latest version of each change record, joined with its snapshot */
    latest_change_with_snapshot AS (
      SELECT
        ic.id, 
        ic.entity_id,
        ic.schema_key,
        ic.file_id,
        ic.plugin_key,
        json(s.content) AS snapshot_content 
      FROM internal_change ic
      LEFT JOIN internal_snapshot s ON ic.snapshot_id = s.id
      WHERE ic.snapshot_id != 'no-content'
      AND ic.rowid = (
        SELECT MAX(ic2.rowid)
        FROM internal_change ic2
        WHERE ic2.entity_id = ic.entity_id
          AND ic2.schema_key = ic.schema_key
          AND ic2.file_id = ic.file_id
      )
    ),

    /* === Graph Traversal Logic === */
    /* 
      1. Identify the root change_set_id for the currently ACTIVE version. 
         This involves two steps:
         a) Find the 'lix_active_version' entity. Its snapshot_content.version_id points to the entity_id of the active 'lix_version'.
         b) Get the 'lix_version' entity identified in (a) and extract its snapshot_content.change_set_id.
    */
    root_cs_of_active_version AS (
      SELECT json_extract(actual_active_version.snapshot_content, '$.change_set_id') AS version_change_set_id
      FROM latest_change_with_snapshot active_version_indicator -- This is the 'lix_active_version' record
      JOIN latest_change_with_snapshot actual_active_version -- This is the actual 'lix_version' record that is active
        ON json_extract(active_version_indicator.snapshot_content, '$.version_id') = actual_active_version.entity_id
        AND actual_active_version.schema_key = 'lix_version' -- Ensure we are joining to a 'lix_version' entity
      WHERE active_version_indicator.schema_key = 'lix_active_version'
      LIMIT 1 -- Assuming there's only one 'lix_active_version' entity, or we take the latest one by rowid from latest_change_with_snapshot
    ),

    /* 2. Recursively find all change_set_ids that are ancestors of the active version's root */
    reachable_cs_from_active_root(id) AS (
      SELECT version_change_set_id FROM root_cs_of_active_version
      UNION
      SELECT json_extract(e.snapshot_content, '$.parent_id')
      FROM latest_change_with_snapshot e 
      JOIN reachable_cs_from_active_root ac ON json_extract(e.snapshot_content, '$.child_id') = ac.id
      WHERE e.schema_key = 'lix_change_set_edge'
    ),

    /* === Change Set Element (CSE) Processing === */
    /* 3. Select all CSEs that belong to any of the reachable change sets */
    cse_in_reachable_cs AS (
      SELECT
        json_extract(ias.snapshot_content, '$.entity_id')    AS target_entity_id,
        json_extract(ias.snapshot_content, '$.file_id')      AS target_file_id,
        json_extract(ias.snapshot_content, '$.schema_key')   AS target_schema_key, 
        json_extract(ias.snapshot_content, '$.change_id')    AS target_change_id,
        json_extract(ias.snapshot_content, '$.change_set_id') AS cse_origin_change_set_id 
      FROM latest_change_with_snapshot ias
      WHERE ias.schema_key = 'lix_change_set_element'
        AND json_extract(ias.snapshot_content, '$.change_set_id') IN (SELECT id FROM reachable_cs_from_active_root)
    ),

    /* 4. Filter to 'leaf' CSEs and retrieve their target entity's full snapshot */
    leaf_target_snapshots AS (
      SELECT 
        target_change.entity_id,
        target_change.schema_key,
        target_change.file_id,
        target_change.plugin_key,
        target_change.snapshot_content AS snapshot_content 
      FROM cse_in_reachable_cs r 
      INNER JOIN latest_change_with_snapshot target_change ON r.target_change_id = target_change.id
      WHERE NOT EXISTS (
        WITH RECURSIVE descendants_of_current_cs(id) AS ( 
          SELECT r.cse_origin_change_set_id 
          UNION
          SELECT json_extract(edge.snapshot_content, '$.child_id')
          FROM latest_change_with_snapshot edge
          JOIN descendants_of_current_cs d ON json_extract(edge.snapshot_content, '$.parent_id') = d.id
          WHERE edge.schema_key = 'lix_change_set_edge'
            AND json_extract(edge.snapshot_content, '$.child_id') IN (SELECT id FROM reachable_cs_from_active_root) 
        )
        SELECT 1
        FROM cse_in_reachable_cs newer_r 
        WHERE newer_r.target_entity_id = r.target_entity_id 
          AND newer_r.target_file_id = r.target_file_id       
          AND newer_r.target_schema_key = r.target_schema_key 
          AND (newer_r.cse_origin_change_set_id != r.cse_origin_change_set_id OR newer_r.target_change_id != r.target_change_id) 
          AND newer_r.cse_origin_change_set_id IN (SELECT id FROM descendants_of_current_cs WHERE id != r.cse_origin_change_set_id) 
      )
    )
        
    /* 5. Final Projection: Expose the snapshots of the leaf target entities */
    SELECT * FROM leaf_target_snapshots;

  CREATE TRIGGER IF NOT EXISTS state_insert
  INSTEAD OF INSERT ON state
  BEGIN
    SELECT validate_snapshot_content(
      (SELECT stored_schema.value FROM stored_schema WHERE stored_schema.key = NEW.schema_key),
      NEW.snapshot_content
    );

    SELECT handle_state_mutation(
      NEW.entity_id,
      NEW.schema_key,
      NEW.file_id,
      NEW.plugin_key,
      NEW.snapshot_content
    );
  END;

  CREATE TRIGGER IF NOT EXISTS state_update
  INSTEAD OF UPDATE ON state
  BEGIN
    SELECT validate_snapshot_content(
      (SELECT stored_schema.value FROM stored_schema WHERE stored_schema.key = NEW.schema_key),
      NEW.snapshot_content
    );

    SELECT handle_state_mutation(
      NEW.entity_id,
      NEW.schema_key,
      NEW.file_id,
      NEW.plugin_key,
      NEW.snapshot_content
    );
  END;

  CREATE TRIGGER IF NOT EXISTS state_delete
  INSTEAD OF DELETE ON state
  BEGIN
    SELECT handle_state_mutation(
      OLD.entity_id,
      OLD.schema_key,
      OLD.file_id,
      OLD.plugin_key,
      null
    );
  END;
`;

	return sqlite.exec(sql);
}

export type StateRow = Selectable<StateView>;
export type NewStateRow = Insertable<StateView>;
export type StateRowUpdate = Updateable<StateView>;
export type StateView = {
	entity_id: string;
	schema_key: string;
	file_id: string;
	plugin_key: string;
	snapshot_content: JSONType;
	version_change_set_id?: string | null;
	leaf_change_ids?: string | null;
};
