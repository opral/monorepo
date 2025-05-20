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
  CREATE VIEW IF NOT EXISTS internal_all_state AS
  SELECT
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
  );


  CREATE VIEW IF NOT EXISTS state AS
  WITH main_version_change_set AS (
    SELECT json_extract(snapshot_content, '$.change_set_id') AS version_change_set_id
    FROM internal_all_state
    WHERE schema_key = 'lix_version'
      AND json_extract(snapshot_content, '$.name') = 'main'
    LIMIT 1
  ),
  -- Recursively gather all change sets reachable from the main version's root change set
  ancestor_cs(id) AS (
    SELECT version_change_set_id FROM main_version_change_set
    UNION
    -- traverse from child back to parent
    SELECT json_extract(e.snapshot_content, '$.parent_id')
    FROM internal_all_state e
    JOIN ancestor_cs ac ON json_extract(e.snapshot_content, '$.child_id') = ac.id
    WHERE e.schema_key = 'lix_change_set_edge'

  ),
  -- Collect all edge entity_ids touching those change sets for debugging
  collected_edges AS (
    SELECT json_group_array(e.entity_id) AS change_set_edges
    FROM internal_all_state e
    WHERE e.schema_key = 'lix_change_set_edge'
      AND (
        json_extract(e.snapshot_content, '$.parent_id') IN (SELECT id FROM ancestor_cs)
        OR json_extract(e.snapshot_content, '$.child_id') IN (SELECT id FROM ancestor_cs)
      )
  ),
  -- Aggregate all change_ids from elements in ancestor change sets
  aggregated_change_ids AS (
    SELECT json_group_array(json_extract(e.snapshot_content, '$.change_id')) AS change_ids
    FROM internal_all_state e
    WHERE e.schema_key = 'lix_change_set_element'
      AND json_extract(e.snapshot_content, '$.change_set_id') IN (SELECT id FROM ancestor_cs)
  )
      
  SELECT
    ias.*,
    main_version_change_set.version_change_set_id,
    collected_edges.change_set_edges,
    aggregated_change_ids.change_ids
  FROM internal_all_state ias
  CROSS JOIN main_version_change_set
  CROSS JOIN collected_edges
  CROSS JOIN aggregated_change_ids;

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
	change_set_edges?: string | null;
	change_ids?: string | null;
};
