import type { Selectable } from "kysely";
import type { Lix } from "../lix/open-lix.js";

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
	 * The actual commit ID where this entity state was originally created.
	 *
	 * This represents the true origin commit for each historical state, making it easy
	 * to understand the provenance of each entity state without additional joins.
	 *
	 * For example, when viewing history you might see:
	 * - depth 0: commit_id = 'commit-123' (current state created in commit-123)
	 * - depth 2: commit_id = 'commit-100' (historical state created in commit-100)
	 *
	 * This tells you exactly where each state was created in the commit graph.
	 */
	commit_id: string;

	/**
	 * The root commit ID used as the starting point for traversing history.
	 *
	 * When querying history from a specific commit, this field contains that
	 * commit ID for all returned rows. Used with `depth` to understand how
	 * far back in history each entity state is from this root.
	 *
	 * For example, if you query `WHERE root_commit_id = 'commit-123'`,
	 * all returned rows will have `root_commit_id = 'commit-123'`.
	 */
	root_commit_id: string;

	/**
	 * Depth of this entity state relative to the root_commit_id.
	 * - depth = 0: Current state at the queried commit_id
	 * - depth = 1: One commit back in history (parent)
	 * - depth = 2: Two commits back in history (grandparent)
	 * - etc.
	 *
	 * Depth is calculated by traversing the commit ancestry graph backwards
	 * from the queried commit_id through parent commit edges.
	 * Used for blame functionality to show how entities evolved over time.
	 */
	depth: number;

	/**
	 * TODO https://github.com/opral/lix-sdk/issues/320
	 *
	 * JSON array of change-set IDs that are the direct parents of the given change-set.
	 * For a merge change set this array has ≥2 IDs; for the initial version it is empty.
	 *
	 * Use the property to display graphs in the UI by providing parent relationships.
	 *
	 * Example change set graph (newest to oldest):
	 *
	 * ```
	 *     A (parent_change_set_ids: ["B"])      <- queried change set
	 *     |
	 *     B (parent_change_set_ids: ["C","D"])  <- merge change set
	 *    / \
	 *   C   D (parent_change_set_ids: ["E"], ["F"])
	 *   |   |
	 *   |   F (parent_change_set_ids: ["E"])
	 *    \ /
	 *     E (parent_change_set_ids: ["G"])      <- common ancestor of C & F
	 *     |
	 *     G (parent_change_set_ids: [])         <- initial (no parents)
	 * ```
	 */
	// parent_change_set_ids: string[];
}

export type StateHistoryView = Selectable<StateHistoryTable>;

export function applyStateHistoryDatabaseSchema(
	lix: Pick<Lix, "sqlite" | "db">
): void {
	lix.sqlite.exec(STATE_HISTORY_VIEW_SQL);
}

// Optimized to keep the generic history view, but add a fast path for depth=0
// to avoid whole-graph recursion for common queries like "WHERE depth = 0".
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

	-- Fast path for depth = 0 (no recursion, direct commit join)
	depth0_entity_states AS (
		SELECT 
			chg.entity_id,
			chg.schema_key,
			chg.file_id,
			chg.plugin_key,
			chg.snapshot_content,
			chg.schema_version,
			cse.change_id AS target_change_id,
			c.id AS origin_commit_id,
			c.id AS root_commit_id,
			0 AS commit_depth
		FROM change_set_element_all cse
		JOIN commit_all c 
			ON cse.change_set_id = c.change_set_id 
			AND c.lixcol_version_id = 'global'
		JOIN all_changes_with_snapshots chg 
			ON chg.id = cse.change_id
		WHERE cse.lixcol_version_id = 'global'
	),

	-- General path for depth > 0 (recursive, ancestors of requested commits)
	requested_commits AS (
		SELECT DISTINCT c.id as commit_id
		FROM commit_all c
	),
	reachable_commits_from_requested(id, root_commit_id, depth) AS (
		SELECT commit_id, commit_id as root_commit_id, 0 as depth 
		FROM requested_commits
		UNION
		SELECT ce.parent_id, r.root_commit_id, r.depth + 1
		FROM commit_edge_all ce 
		JOIN reachable_commits_from_requested r ON ce.child_id = r.id
		WHERE ce.lixcol_version_id = 'global'
	),
	commit_changesets AS (
		SELECT 
			c.id as commit_id,
			c.change_set_id as change_set_id,
			rc.root_commit_id,
			rc.depth as commit_depth
		FROM commit_all c
		JOIN reachable_commits_from_requested rc ON c.id = rc.id
		WHERE c.lixcol_version_id = 'global'
	),
	cse_in_reachable_commits AS (
		SELECT cse.entity_id AS target_entity_id,
			   cse.file_id AS target_file_id,
			   cse.schema_key AS target_schema_key, 
			   cse.change_id AS target_change_id,
			   cse.change_set_id AS cse_origin_change_set_id,
			   cc.commit_id AS origin_commit_id,
			   cc.root_commit_id,
			   cc.commit_depth,
			   cc.commit_id as depth_commit_id
		FROM change_set_element_all cse
		JOIN commit_changesets cc ON cse.change_set_id = cc.change_set_id
		WHERE cse.lixcol_version_id = 'global'
	),
	latest_change_per_entity_per_depth AS (
		SELECT 
			r.target_entity_id,
			r.target_file_id,
			r.target_schema_key,
			r.root_commit_id,
			r.commit_depth,
			r.depth_commit_id,
			MAX(target_change.created_at) as latest_created_at
		FROM cse_in_reachable_commits r 
		INNER JOIN all_changes_with_snapshots target_change ON r.target_change_id = target_change.id
		GROUP BY r.target_entity_id, r.target_file_id, r.target_schema_key, r.root_commit_id, r.commit_depth
	),
	depthN_entity_states AS (
		SELECT 
			target_change.entity_id, 
			target_change.schema_key, 
			target_change.file_id,
			target_change.plugin_key, 
			target_change.snapshot_content,
			target_change.schema_version,
			r.target_change_id,
			r.origin_commit_id,
			r.root_commit_id,
			latest.commit_depth
		FROM latest_change_per_entity_per_depth latest
		INNER JOIN cse_in_reachable_commits r ON (
			latest.target_entity_id = r.target_entity_id 
			AND latest.target_file_id = r.target_file_id
			AND latest.target_schema_key = r.target_schema_key
			AND latest.root_commit_id = r.root_commit_id
			AND latest.commit_depth = r.commit_depth
		)
		INNER JOIN all_changes_with_snapshots target_change ON (
			r.target_change_id = target_change.id
			AND target_change.created_at = latest.latest_created_at
		)
		WHERE latest.commit_depth > 0
	)

SELECT 
	es.entity_id,
	es.schema_key,
	es.file_id,
	es.plugin_key,
	es.snapshot_content,
	es.schema_version,
	es.target_change_id as change_id,
	es.origin_commit_id as commit_id,
	es.root_commit_id as root_commit_id,
	es.commit_depth as depth
FROM (
	SELECT * FROM depth0_entity_states
	UNION ALL
	SELECT * FROM depthN_entity_states
) AS es
WHERE es.snapshot_content IS NOT NULL  -- Exclude deletions for now
ORDER BY es.entity_id, es.commit_depth;
`;
