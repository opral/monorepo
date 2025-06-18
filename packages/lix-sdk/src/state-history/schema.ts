import type { Selectable } from "kysely";
import type { StateView } from "../state/schema.js";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export interface StateHistoryTable extends StateView {
	change_set_id: string;
	depth: number;
}

export type StateHistoryView = Selectable<StateHistoryTable>;

export function applyStateHistoryDatabaseSchema(sqlite: SqliteWasmDatabase): SqliteWasmDatabase {
	sqlite.exec(STATE_HISTORY_VIEW_SQL);
	return sqlite;
}

// Implementation to materialize state from changes for a given change_set_id
// This implementation returns multiple historical states per entity across different depths
export const STATE_HISTORY_VIEW_SQL = `
CREATE VIEW IF NOT EXISTS state_history AS
WITH
	-- Get all changes with their snapshots
	all_changes_with_snapshots AS (
		SELECT ic.id, ic.entity_id, ic.schema_key, ic.file_id, ic.plugin_key,
			   ic.schema_version, ic.created_at,
			   CASE 
			     WHEN ic.snapshot_id = 'no-content' THEN NULL
			     ELSE json(s.content)
			   END AS snapshot_content 
		FROM internal_change ic
		LEFT JOIN internal_snapshot s ON ic.snapshot_id = s.id
	),
	-- For state_history, we work with any change_set_id, not just version heads
	requested_change_sets AS (
		SELECT DISTINCT cs.id as change_set_id
		FROM change_set cs
		-- This will be filtered by the WHERE clause in queries
	),
	-- Find all change sets reachable from requested ones (including ancestors)
	reachable_cs_from_requested(id, root_change_set_id, depth) AS (
		SELECT change_set_id, change_set_id as root_change_set_id, 0 as depth 
		FROM requested_change_sets
		UNION
		SELECT json_extract(e.snapshot_content, '$.parent_id'), r.root_change_set_id, r.depth + 1
		FROM all_changes_with_snapshots e 
		JOIN reachable_cs_from_requested r ON json_extract(e.snapshot_content, '$.child_id') = r.id
		WHERE e.schema_key = 'lix_change_set_edge'
	),
	-- Find all change set elements in reachable change sets
	cse_in_reachable_cs AS (
		SELECT json_extract(ias.snapshot_content, '$.entity_id') AS target_entity_id,
			   json_extract(ias.snapshot_content, '$.file_id') AS target_file_id,
			   json_extract(ias.snapshot_content, '$.schema_key') AS target_schema_key, 
			   json_extract(ias.snapshot_content, '$.change_id') AS target_change_id,
			   json_extract(ias.snapshot_content, '$.change_set_id') AS cse_origin_change_set_id,
			   rcs.root_change_set_id,
			   rcs.depth as changeset_depth,
			   rcs.id as depth_change_set_id
		FROM all_changes_with_snapshots ias
		JOIN reachable_cs_from_requested rcs ON json_extract(ias.snapshot_content, '$.change_set_id') = rcs.id
		WHERE ias.schema_key = 'lix_change_set_element'
	),
	-- For each entity at each depth, find the latest change within that depth's change set
	latest_change_per_entity_per_depth AS (
		SELECT 
			r.target_entity_id,
			r.target_file_id,
			r.target_schema_key,
			r.root_change_set_id,
			r.changeset_depth,
			r.depth_change_set_id,
			MAX(target_change.created_at) as latest_created_at
		FROM cse_in_reachable_cs r 
		INNER JOIN all_changes_with_snapshots target_change ON r.target_change_id = target_change.id
		GROUP BY r.target_entity_id, r.target_file_id, r.target_schema_key, r.root_change_set_id, r.changeset_depth
	),
	-- Get the actual changes for each entity at each depth
	entity_states_at_depths AS (
		SELECT 
			target_change.entity_id, 
			target_change.schema_key, 
			target_change.file_id,
			target_change.plugin_key, 
			target_change.snapshot_content,
			target_change.schema_version,
			target_change.created_at,
			latest.root_change_set_id,
			latest.changeset_depth
		FROM latest_change_per_entity_per_depth latest
		INNER JOIN cse_in_reachable_cs r ON (
			latest.target_entity_id = r.target_entity_id 
			AND latest.target_file_id = r.target_file_id
			AND latest.target_schema_key = r.target_schema_key
			AND latest.root_change_set_id = r.root_change_set_id
			AND latest.changeset_depth = r.changeset_depth
		)
		INNER JOIN all_changes_with_snapshots target_change ON (
			r.target_change_id = target_change.id
			AND target_change.created_at = latest.latest_created_at
		)
	)
SELECT 
	esad.entity_id,
	esad.schema_key,
	esad.file_id,
	NULL as version_id,  -- TODO: derive from change_set_id
	esad.plugin_key,
	esad.snapshot_content,
	esad.schema_version,
	esad.created_at,
	esad.created_at as updated_at,  -- Use same timestamp for both for now
	NULL as inherited_from_version_id,  -- No inheritance for now
	esad.root_change_set_id as change_set_id,
	esad.changeset_depth as depth
FROM entity_states_at_depths esad
WHERE esad.snapshot_content IS NOT NULL  -- Exclude deletions for now
ORDER BY esad.entity_id, esad.changeset_depth;
`;