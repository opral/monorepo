import type { Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { validateLixSchemaWithConstraints } from "./validate-schema-with-constraints.js";
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
			return validateLixSchemaWithConstraints({
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
				args[4], // snapshot_content,
				args[5] // version_id
			);
		},
	});

	const sql = `
  CREATE VIEW IF NOT EXISTS state AS
  WITH
    /* 0. Base data: all change records, joined with their snapshot, including rowid */
    all_changes_with_snapshots AS (
      SELECT
        ic.id, 
        ic.entity_id,
        ic.schema_key,
        ic.file_id,
        ic.plugin_key,
        ic.rowid, -- expose rowid for specific MAX filters later
        json(s.content) AS snapshot_content 
      FROM internal_change ic
      LEFT JOIN internal_snapshot s ON ic.snapshot_id = s.id
      WHERE ic.snapshot_id != 'no-content'
    ),

    /* === Graph Traversal Logic === */
    /* 
      1. Identify the root change_set_id for ALL LATEST versions.
    */
    root_cs_of_all_versions AS (
      SELECT 
        json_extract(v.snapshot_content, '$.change_set_id') AS version_change_set_id, 
        v.entity_id AS version_id
      FROM all_changes_with_snapshots v
      WHERE v.schema_key = 'lix_version'
    ),

    /* 2. Recursively find all change_set_ids that are ancestors of EACH version's root */
    reachable_cs_from_roots(id, version_id) AS (
      SELECT version_change_set_id, version_id FROM root_cs_of_all_versions
      UNION
      SELECT 
        json_extract(e.snapshot_content, '$.parent_id'),
        r.version_id -- Propagate version_id
      FROM all_changes_with_snapshots e 
      JOIN reachable_cs_from_roots r ON json_extract(e.snapshot_content, '$.child_id') = r.id
      WHERE e.schema_key = 'lix_change_set_edge'
    ),

    /* === Change Set Element (CSE) Processing === */
    /* 3. Select all LATEST CSEs that belong to any of the reachable change sets, include version_id */
    cse_in_reachable_cs AS (
      SELECT
        json_extract(ias.snapshot_content, '$.entity_id')    AS target_entity_id,
        json_extract(ias.snapshot_content, '$.file_id')      AS target_file_id,
        json_extract(ias.snapshot_content, '$.schema_key')   AS target_schema_key, 
        json_extract(ias.snapshot_content, '$.change_id')    AS target_change_id,
        json_extract(ias.snapshot_content, '$.change_set_id') AS cse_origin_change_set_id,
        rcs.version_id -- Propagate version_id
      FROM all_changes_with_snapshots ias
      JOIN reachable_cs_from_roots rcs 
        ON json_extract(ias.snapshot_content, '$.change_set_id') = rcs.id
      WHERE ias.schema_key = 'lix_change_set_element'
    ),

    /* 4. Filter to 'leaf' CSEs per version and retrieve their target entity's full snapshot */
    leaf_target_snapshots AS (
      SELECT 
        target_change.entity_id,
        target_change.schema_key,
        target_change.file_id,
        target_change.plugin_key,
        target_change.snapshot_content AS snapshot_content,
        r.version_id -- Include version_id in the final selection
      FROM cse_in_reachable_cs r 
      INNER JOIN all_changes_with_snapshots target_change ON r.target_change_id = target_change.id
      WHERE NOT EXISTS (
        WITH RECURSIVE descendants_of_current_cs(id) AS ( 
          SELECT r.cse_origin_change_set_id 
          UNION
          SELECT json_extract(edge.snapshot_content, '$.child_id')
          FROM all_changes_with_snapshots edge
          JOIN descendants_of_current_cs d ON json_extract(edge.snapshot_content, '$.parent_id') = d.id
          WHERE edge.schema_key = 'lix_change_set_edge'
            AND json_extract(edge.snapshot_content, '$.child_id') IN (SELECT id FROM reachable_cs_from_roots WHERE version_id = r.version_id) 
        )
        SELECT 1
        FROM cse_in_reachable_cs newer_r 
        WHERE newer_r.target_entity_id = r.target_entity_id 
          AND newer_r.target_file_id = r.target_file_id       
          AND newer_r.target_schema_key = r.target_schema_key 
          AND newer_r.version_id = r.version_id -- Crucial: only compare within the same version context
          AND (newer_r.cse_origin_change_set_id != r.cse_origin_change_set_id OR newer_r.target_change_id != r.target_change_id) 
          AND newer_r.cse_origin_change_set_id IN descendants_of_current_cs
      )
    )
  SELECT 
    ls.entity_id,
    ls.schema_key,
    ls.file_id,
    ls.plugin_key,
    ls.snapshot_content,
    ls.version_id
  FROM leaf_target_snapshots ls;

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
      NEW.snapshot_content,
      NEW.version_id
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
      NEW.snapshot_content,
      NEW.version_id
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
      null,
      OLD.version_id
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
	version_id: string;
};
