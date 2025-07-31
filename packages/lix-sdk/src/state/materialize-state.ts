import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export function applyMaterializeStateSchema(sqlite: SqliteWasmDatabase): void {
	// View 1: Version tips - find tip commit without using timestamps
	sqlite.exec(`
		CREATE VIEW IF NOT EXISTS internal_materialization_version_tips AS
		SELECT 
			v.entity_id AS version_id,
			json_extract(v.snapshot_content,'$.commit_id') AS tip_commit_id
		FROM change v
		LEFT JOIN change e
			ON e.schema_key = 'lix_commit_edge' 
			AND json_extract(e.snapshot_content,'$.parent_id') = json_extract(v.snapshot_content,'$.commit_id')
		WHERE v.schema_key = 'lix_version'
		  AND e.id IS NULL; -- No edge where this commit is parent = it's a tip
	`);

	// View 2: Commit graph - lineage with depth (combines old views 3 & 4)
	sqlite.exec(`
		CREATE VIEW IF NOT EXISTS internal_materialization_commit_graph AS
		WITH RECURSIVE commit_paths(commit_id, version_id, depth, path) AS (
			-- Start from version tips at depth 0
			SELECT 
				tip_commit_id, 
				version_id, 
				0,
				',' || tip_commit_id || ',' -- Path for cycle detection
			FROM internal_materialization_version_tips
			
			UNION ALL
			
			-- Walk up parent chain, incrementing depth
			SELECT 
				json_extract(edge.snapshot_content,'$.parent_id'),
				g.version_id,
				g.depth + 1,
				g.path || json_extract(edge.snapshot_content,'$.parent_id') || ','
			FROM change edge
			JOIN commit_paths g ON json_extract(edge.snapshot_content,'$.child_id') = g.commit_id
			WHERE edge.schema_key = 'lix_commit_edge'
			  AND json_extract(edge.snapshot_content,'$.parent_id') IS NOT NULL
			  -- Cycle detection: stop if parent already in path
			  AND INSTR(g.path, ',' || json_extract(edge.snapshot_content,'$.parent_id') || ',') = 0
		)
		-- Group by commit_id and version_id, taking MIN depth for merge commits
		SELECT 
			commit_id,
			version_id,
			MIN(depth) as depth
		FROM commit_paths
		GROUP BY commit_id, version_id;
	`);

	// View 3: Latest visible state - first seen wins, with proper timestamps
	sqlite.exec(`
		CREATE VIEW IF NOT EXISTS internal_materialization_latest_visible_state AS
		WITH commit_changes AS (
			SELECT 
				cg.version_id,
				cg.commit_id,
				cg.depth,
				c.id as change_id,
				c.entity_id,
				c.schema_key,
				c.file_id,
				c.plugin_key,
				c.snapshot_content,
				c.schema_version,
				c.created_at,
				ROW_NUMBER() OVER (
					PARTITION BY cg.version_id, c.entity_id, c.schema_key, c.file_id
					ORDER BY cg.depth ASC
				) as first_seen,
				-- Get first and last change timestamps for proper created_at/updated_at
				MIN(c.created_at) OVER (
					PARTITION BY cg.version_id, c.entity_id, c.schema_key, c.file_id
				) as entity_created_at,
				MAX(c.created_at) OVER (
					PARTITION BY cg.version_id, c.entity_id, c.schema_key, c.file_id
				) as entity_updated_at
			FROM internal_materialization_commit_graph cg
			-- Get commit's change_set_id
			JOIN change cmt ON cmt.entity_id = cg.commit_id 
				AND cmt.schema_key = 'lix_commit'
			-- Get changes in this change_set  
			JOIN change cse ON cse.schema_key = 'lix_change_set_element'
				AND json_extract(cse.snapshot_content,'$.change_set_id') = json_extract(cmt.snapshot_content,'$.change_set_id')
			-- Get the actual change
			JOIN change c ON c.id = json_extract(cse.snapshot_content,'$.change_id')
		)
		SELECT 
			version_id,
			commit_id,
			depth,
			change_id,
			entity_id,
			schema_key,
			file_id,
			plugin_key,
			snapshot_content,
			schema_version,
			entity_created_at as created_at,
			entity_updated_at as updated_at
		FROM commit_changes 
		WHERE first_seen = 1;
		-- Note: We do NOT filter out NULL snapshots here to allow deletion tracking
	`);

	// View 4: Version ancestry - computes the complete ancestral lineage for each version
	// This view recursively follows inherits_from_version_id relationships to build
	// the full ancestry tree. Each version sees:
	// - Itself as an ancestor at depth 0
	// - Its direct parent at depth 1 (if it inherits)
	// - Its grandparent at depth 2
	// - And so on up the inheritance chain
	// Used by the state materializer to implement multi-level inheritance where
	// child versions can see state from all ancestors unless overridden
	sqlite.exec(`
		CREATE VIEW IF NOT EXISTS internal_materialization_version_ancestry AS
		WITH RECURSIVE version_ancestry(version_id, ancestor_version_id, inheritance_depth, path) AS (
			-- Each version is its own ancestor at depth 0
			SELECT 
				entity_id as version_id, 
				entity_id as ancestor_version_id, 
				0 as inheritance_depth,
				',' || entity_id || ',' -- Path for cycle detection
			FROM change 
			WHERE schema_key = 'lix_version'
			
			UNION ALL
			
			-- Recursively find all ancestors
			SELECT
				va.version_id,
				json_extract(parent_v.snapshot_content,'$.inherits_from_version_id'),
				va.inheritance_depth + 1,
				va.path || json_extract(parent_v.snapshot_content,'$.inherits_from_version_id') || ','
			FROM version_ancestry va
			JOIN change parent_v 
				ON parent_v.entity_id = va.ancestor_version_id 
				AND parent_v.schema_key = 'lix_version'
			WHERE json_extract(parent_v.snapshot_content,'$.inherits_from_version_id') IS NOT NULL
			  -- Cycle detection: stop if ancestor already in path
			  AND INSTR(va.path, ',' || json_extract(parent_v.snapshot_content,'$.inherits_from_version_id') || ',') = 0
		)
		SELECT version_id, ancestor_version_id, inheritance_depth 
		FROM version_ancestry;
	`);

	// View 5: Final state materializer with multi-level inheritance
	sqlite.exec(`
		CREATE VIEW IF NOT EXISTS internal_state_materializer AS
		WITH all_possible_states AS (
			SELECT
				va.version_id,
				s.entity_id,
				s.schema_key,
				s.file_id,
				s.plugin_key,
				s.snapshot_content,
				s.schema_version,
				s.created_at,
				s.updated_at,
				s.change_id,
				s.commit_id,
				va.ancestor_version_id,
				va.inheritance_depth,
				-- Rank by inheritance depth - closer ancestors win
				ROW_NUMBER() OVER (
					PARTITION BY va.version_id, s.entity_id, s.schema_key, s.file_id
					ORDER BY va.inheritance_depth ASC
				) as inheritance_rank
			FROM internal_materialization_version_ancestry va
			JOIN internal_materialization_latest_visible_state s
				ON s.version_id = va.ancestor_version_id
		)
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
			CASE 
				WHEN inheritance_depth > 0 THEN ancestor_version_id 
				ELSE NULL 
			END as inherited_from_version_id,
			0 as untracked,
			change_id,
			commit_id
		FROM all_possible_states
		-- inheritance_rank = 1 means this is the closest ancestor that has state for this entity
		-- (rank 1 = direct state, rank 2 = parent state, rank 3 = grandparent state, etc.)
		-- We only want the most specific/closest state, not all inherited variants
		WHERE inheritance_rank = 1;
		-- Note: Now includes tombstones (null snapshot_content) for proper deletion handling
	`);

}
