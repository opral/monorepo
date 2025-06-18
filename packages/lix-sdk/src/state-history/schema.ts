import type { Selectable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

/**
 * State history table interface for querying historical entity states.
 * 
 * This view provides access to entity states at specific points in change set history,
 * with depth-based traversal for blame functionality and diff operations.
 */
export interface StateHistoryTable {
	/** Unique identifier of the entity */
	entity_id: string;
	
	/** Schema type identifier (e.g., 'paragraph', 'comment') */
	schema_key: string;
	
	/** File identifier where this entity is stored */
	file_id: string;
	
	/** Plugin identifier that manages this entity type */
	plugin_key: string;
	
	/** JSON content of the entity at this point in history */
	snapshot_content: Record<string, any>;
	
	/** Version of the schema used for this entity */
	schema_version: string;
	
	/** 
	 * ID of the change that created this entity state.
	 * Join with the `change` table to get created_at, author info, and other change metadata.
	 * Example: `JOIN change ON state_history.change_id = change.id`
	 */
	change_id: string;
	
	/** 
	 * Change set ID that serves as the root/starting point for depth calculation.
	 * This is the change_set_id that was queried, NOT the change set where this 
	 * specific entity state was originally created.
	 * 
	 * For example, if you query `WHERE change_set_id = 'checkpoint-123'`, then
	 * all returned rows will have `change_set_id = 'checkpoint-123'`, even if
	 * some entity states came from earlier change sets (at depth > 0).
	 * 
	 * To get the actual change set where this entity state was created,
	 * join with the change table: `JOIN change ON state_history.change_id = change.id`
	 * and then `JOIN change_set_element ON change.id = change_set_element.change_id`.
	 */
	change_set_id: string;
	
	/** 
	 * Depth of this entity state relative to the queried change_set_id.
	 * - depth = 0: Current state at the queried change_set_id
	 * - depth = 1: One change set back in history (parent)
	 * - depth = 2: Two change sets back in history (grandparent)
	 * - etc.
	 * 
	 * Depth is calculated by traversing the change set ancestry graph backwards
	 * from the queried change_set_id through parent change set edges.
	 * Used for blame functionality to show how entities evolved over time.
	 */
	depth: number;
}

export type StateHistoryView = Selectable<StateHistoryTable>;

export function applyStateHistoryDatabaseSchema(sqlite: SqliteWasmDatabase): SqliteWasmDatabase {
	sqlite.exec(STATE_HISTORY_VIEW_SQL);
	return sqlite;
}

// Optimized to use materialized change_set_edge_all and change_set_element_all from global version
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
		SELECT cse.parent_id, r.root_change_set_id, r.depth + 1
		FROM change_set_edge_all cse 
		JOIN reachable_cs_from_requested r ON cse.child_id = r.id
		WHERE cse.lixcol_version_id = 'global'
	),
	-- Find all change set elements in reachable change sets
	cse_in_reachable_cs AS (
		SELECT cse.entity_id AS target_entity_id,
			   cse.file_id AS target_file_id,
			   cse.schema_key AS target_schema_key, 
			   cse.change_id AS target_change_id,
			   cse.change_set_id AS cse_origin_change_set_id,
			   rcs.root_change_set_id,
			   rcs.depth as changeset_depth,
			   rcs.id as depth_change_set_id
		FROM change_set_element_all cse
		JOIN reachable_cs_from_requested rcs ON cse.change_set_id = rcs.id
		WHERE cse.lixcol_version_id = 'global'
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
			r.target_change_id,
			r.cse_origin_change_set_id,
			r.root_change_set_id,
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
	esad.plugin_key,
	esad.snapshot_content,
	esad.schema_version,
	esad.target_change_id as change_id,
	esad.root_change_set_id as change_set_id,
	esad.changeset_depth as depth
FROM entity_states_at_depths esad
WHERE esad.snapshot_content IS NOT NULL  -- Exclude deletions for now
ORDER BY esad.entity_id, esad.changeset_depth;
`;