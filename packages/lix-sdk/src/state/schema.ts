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
  -- Elements within ancestor change sets
  relevant_elements AS (
    SELECT
      json_extract(ias.snapshot_content, '$.entity_id') AS entity_id,
      json_extract(ias.snapshot_content, '$.file_id') AS file_id,
      json_extract(ias.snapshot_content, '$.schema_key') AS schema_key,
      json_extract(ias.snapshot_content, '$.change_id') AS change_id,
      json_extract(ias.snapshot_content, '$.change_set_id') AS change_set_id
    FROM internal_all_state ias
    WHERE ias.schema_key = 'lix_change_set_element'
      AND json_extract(ias.snapshot_content, '$.change_set_id') IN (SELECT id FROM ancestor_cs)
  ),
  -- Filter to leaf elements
  leaf_elements AS (
    SELECT r.change_id
    FROM relevant_elements r
    WHERE NOT EXISTS (
      WITH RECURSIVE descendants_of_current_cs(id) AS (
        SELECT r.change_set_id
        UNION
        SELECT json_extract(edge.snapshot_content, '$.child_id')
        FROM internal_all_state edge
        JOIN descendants_of_current_cs d ON json_extract(edge.snapshot_content, '$.parent_id') = d.id
        WHERE edge.schema_key = 'lix_change_set_edge'
          AND json_extract(edge.snapshot_content, '$.child_id') IN (SELECT id FROM ancestor_cs) -- Must be within overall ancestor scope
      )
      SELECT 1
      FROM relevant_elements newer_r
      WHERE newer_r.entity_id = r.entity_id
        AND newer_r.file_id = r.file_id
        AND newer_r.schema_key = r.schema_key
        AND (newer_r.change_set_id != r.change_set_id OR newer_r.change_id != r.change_id) -- Different element
        AND newer_r.change_set_id IN (SELECT id FROM descendants_of_current_cs WHERE id != r.change_set_id) -- Newer CS is strict descendant of current element's CS
    )
  )
      
  SELECT
    ias.*,
    main_version_change_set.version_change_set_id
  FROM internal_all_state ias
  CROSS JOIN main_version_change_set;

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
