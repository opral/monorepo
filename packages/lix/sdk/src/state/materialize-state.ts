import type { Lix } from "../index.js";

export function applyMaterializeStateSchema(
	lix: Pick<Lix, "sqlite" | "db" | "hooks">
): void {
	// View 0: Unified commit edges (derived from all commit rows ∪ physical rows)
	// Ensure latest definition is applied
	lix.sqlite.exec(`
        CREATE VIEW IF NOT EXISTS internal_materialization_all_commit_edges AS
        WITH derived AS (
            SELECT
                je.value AS parent_id,
                c.entity_id AS child_id
            FROM change c
            JOIN json_each(json_extract(c.snapshot_content,'$.parent_commit_ids')) je
            WHERE c.schema_key = 'lix_commit'
              AND json_type(json_extract(c.snapshot_content,'$.parent_commit_ids')) = 'array'
        ),
        physical AS (
            SELECT
                json_extract(e.snapshot_content,'$.parent_id') AS parent_id,
                json_extract(e.snapshot_content,'$.child_id')  AS child_id
            FROM change e
            WHERE e.schema_key = 'lix_commit_edge'
        )
        SELECT DISTINCT parent_id, child_id FROM derived
        UNION
        SELECT DISTINCT parent_id, child_id FROM physical;
    `);
	// View 1: Version tips - one row per version with its current tip commit
	// Rule: "if a version entity exists, the version is active. even if other versions 'build' on this version by branching away from the commit"
	// A commit C is the tip for version V iff:
	// • C appears in at least one lix_version_tip change row for V AND
	// • there is no commit that is both a child of C in lix_commit_edge table AND referenced by any lix_version_tip row of the same version V
	lix.sqlite.exec(`
        CREATE VIEW IF NOT EXISTS internal_materialization_version_tips AS
        WITH
        -- 1. every (version, commit) ever recorded
        version_commits(version_id, commit_id) AS (
            SELECT
                v.entity_id,
                json_extract(v.snapshot_content,'$.commit_id')
            FROM change v
            WHERE v.schema_key = 'lix_version_tip'
              AND json_extract(v.snapshot_content,'$.commit_id') IS NOT NULL
        ),
        -- 2. mark (version, commit) pairs that still have a child commit referenced by the same version
        non_tips AS (
            SELECT DISTINCT
                vc.version_id,
                vc.commit_id
            FROM version_commits vc
            JOIN internal_materialization_all_commit_edges e
                ON e.parent_id = vc.commit_id
            JOIN version_commits vc_child
                ON vc_child.commit_id = e.child_id
                AND vc_child.version_id = vc.version_id -- same version!
        )
        -- 3. tips = version commits that are NOT in the non_tip set
        SELECT
            vc.version_id,
            vc.commit_id AS tip_commit_id
        FROM version_commits vc
        WHERE NOT EXISTS (
            SELECT 1
            FROM non_tips nt
            WHERE nt.version_id = vc.version_id
            AND nt.commit_id = vc.commit_id
        );
    `);

	// View 2: Commit graph - lineage with depth (cache-free, DAG traversal)
	// Assumes commit graph is a DAG; enforce cycle checks at write time if needed.
	lix.sqlite.exec(`
		CREATE VIEW IF NOT EXISTS internal_materialization_commit_graph AS
		WITH RECURSIVE commit_paths(commit_id, version_id, depth) AS (
			-- Start from version tips at depth 0
			SELECT 
				tip_commit_id, 
				version_id, 
				0
			FROM internal_materialization_version_tips
			
			UNION ALL
			
			-- Walk up parent chain, incrementing depth
			SELECT 
				e.parent_id,
				g.version_id,
				g.depth + 1
			FROM internal_materialization_all_commit_edges e
			JOIN commit_paths g ON e.child_id = g.commit_id
			WHERE e.parent_id IS NOT NULL
		)
		-- Group by commit_id and version_id, taking MIN depth for merge commits
		SELECT 
			commit_id,
			version_id,
			MIN(depth) as depth
		FROM commit_paths
		GROUP BY commit_id, version_id;
	`);

	// View 3: Latest visible state - derive commit membership from commit.change_ids
	// We explode commit.change_ids for each commit in the graph and join with change table
	// to obtain the actual change rows for that commit.
	// Ensure latest definition is applied

	lix.sqlite.exec(`
        CREATE VIEW IF NOT EXISTS internal_materialization_latest_visible_state AS
        WITH cg_distinct AS (
            SELECT commit_id, version_id, MIN(depth) AS depth
            FROM internal_materialization_commit_graph
            GROUP BY commit_id, version_id
        ),
        commit_targets AS (
			-- Only path: change_ids embedded in commit snapshot
			SELECT 
				cg.version_id,
				cg.commit_id,
				cg.depth,
				j.value AS target_change_id
			FROM cg_distinct cg
            JOIN change cmt ON cmt.entity_id = cg.commit_id 
                AND cmt.schema_key = 'lix_commit'
            JOIN json_each(json_extract(cmt.snapshot_content,'$.change_ids')) j
    ),
        -- Global dedupe for commit-target pairs (used by global projections like CSE)
        commit_targets_distinct AS (
            -- De-duplicate commit-target pairs across version graph contexts for global projections,
            -- keeping the smallest depth (closest to tip)
            SELECT commit_id, MIN(depth) AS depth, target_change_id
            FROM commit_targets
            GROUP BY commit_id, target_change_id
        ),
        commit_changes AS (
            SELECT 
            ct.version_id AS version_id,
            ct.commit_id,
            ct.depth,
            c.id as change_id,
            c.entity_id,
            c.schema_key,
            c.file_id,
            c.plugin_key,
            c.snapshot_content,
            c.schema_version,
            c.created_at,
            ROW_NUMBER() OVER (
                PARTITION BY ct.version_id, c.entity_id, c.schema_key, c.file_id
                ORDER BY ct.depth ASC
            ) as first_seen,
            FIRST_VALUE(c.created_at) OVER (
                PARTITION BY ct.version_id, c.entity_id, c.schema_key, c.file_id
                ORDER BY ct.depth DESC
                ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
            ) as entity_created_at,
            FIRST_VALUE(c.created_at) OVER (
                PARTITION BY ct.version_id, c.entity_id, c.schema_key, c.file_id
                ORDER BY ct.depth ASC
                ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
            ) as entity_updated_at
        FROM commit_targets ct
        JOIN change c ON c.id = ct.target_change_id
        WHERE c.schema_key != 'lix_version'
          AND c.schema_key != 'lix_version_tip'
    ),
    -- Tip rows are FOLLOWING the authoritative tips view (graph is source of truth)
    lvs_version_global AS (
        SELECT
            'global'              AS version_id,
            t.tip_commit_id       AS commit_id,
            0                     AS depth,
            COALESCE(
                MIN(v.id),
                'syn~' || t.version_id || '~' || t.tip_commit_id
            )                      AS change_id,
            t.version_id           AS entity_id,
            'lix_version_tip'      AS schema_key,
            'lix'                  AS file_id,
            'lix_own_entity'       AS plugin_key,
            json_object(
                'id',        t.version_id,
                'commit_id', t.tip_commit_id
            )                      AS snapshot_content,
            COALESCE(MIN(v.schema_version), '1.0') AS schema_version,
            MIN(v.created_at)       AS entity_created_at,
            MIN(v.created_at)       AS entity_updated_at
        FROM internal_materialization_version_tips t
        LEFT JOIN change v
          ON v.schema_key = 'lix_version_tip'
         AND v.entity_id  = t.version_id
         AND json_extract(v.snapshot_content,'$.commit_id') = t.tip_commit_id
        GROUP BY t.version_id, t.tip_commit_id
    ),
    commit_rows_global AS (
        -- Materialize commit change rows for all commits in the graph (global scope)
        SELECT 
            'global' AS version_id,
            cg.commit_id,
            cg.depth,
            c.id as change_id,
            c.entity_id,
            'lix_commit' AS schema_key,
            'lix' AS file_id,
            'lix_own_entity' AS plugin_key,
            c.snapshot_content,
            c.schema_version,
            c.created_at AS entity_created_at,
            c.created_at AS entity_updated_at,
            ROW_NUMBER() OVER (
                PARTITION BY 'global', c.entity_id, 'lix_commit', 'lix'
                ORDER BY cg.depth ASC
            ) AS first_seen
        FROM internal_materialization_commit_graph cg
        JOIN change c ON c.entity_id = cg.commit_id AND c.schema_key = 'lix_commit'
    ),
    commit_cse AS (
        -- Derive committed CSE rows from commit membership (one per (commit, change))
        SELECT 
            'global' AS version_id,
            ct.commit_id,
            ct.depth,
            c.id as change_id,
            -- CSE entity_id convention: change_set_id~change_id
            (json_extract(cmt.snapshot_content,'$.change_set_id') || '~' || c.id) AS entity_id,
            'lix_change_set_element' AS schema_key,
            'lix' AS file_id,
            'lix_own_entity' AS plugin_key,
            json_object(
                'change_set_id', json_extract(cmt.snapshot_content,'$.change_set_id'),
                'change_id', c.id,
                'entity_id', c.entity_id,
                'schema_key', c.schema_key,
                'file_id', c.file_id
            ) AS snapshot_content,
            '1.0' AS schema_version,
            c.created_at AS created_at,
            ROW_NUMBER() OVER (
                PARTITION BY 'global', (json_extract(cmt.snapshot_content,'$.change_set_id') || '~' || c.id), 'lix_change_set_element', 'lix'
                ORDER BY ct.depth ASC
            ) AS first_seen,
            FIRST_VALUE(c.created_at) OVER (
                PARTITION BY 'global', (json_extract(cmt.snapshot_content,'$.change_set_id') || '~' || c.id), 'lix_change_set_element', 'lix'
                ORDER BY ct.depth DESC
                ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
            ) AS entity_created_at,
            FIRST_VALUE(c.created_at) OVER (
                PARTITION BY 'global', (json_extract(cmt.snapshot_content,'$.change_set_id') || '~' || c.id), 'lix_change_set_element', 'lix'
                ORDER BY ct.depth ASC
                ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
            ) AS entity_updated_at
        FROM commit_targets_distinct ct
        JOIN change cmt ON cmt.entity_id = ct.commit_id AND cmt.schema_key = 'lix_commit'
        JOIN change c ON c.id = ct.target_change_id
    ),
        commit_edges AS (
            -- Derive commit_edge rows from commit snapshots (global scope)
            SELECT 
                'global' AS version_id,
                cg.commit_id,
            cg.depth,
            -- Change id uses the child commit change id for stable origin tracking
            cmt.id AS change_id,
            -- entity id key: parent~child
            (je.value || '~' || cg.commit_id) AS entity_id,
            'lix_commit_edge' AS schema_key,
            'lix' AS file_id,
            'lix_own_entity' AS plugin_key,
            json_object(
                'parent_id', je.value,
                'child_id', cg.commit_id
            ) AS snapshot_content,
            '1.0' AS schema_version,
            cmt.created_at AS created_at,
            ROW_NUMBER() OVER (
                PARTITION BY 'global', (je.value || '~' || cg.commit_id), 'lix_commit_edge', 'lix'
                ORDER BY cg.depth ASC
            ) AS first_seen,
            FIRST_VALUE(cmt.created_at) OVER (
                PARTITION BY 'global', (je.value || '~' || cg.commit_id), 'lix_commit_edge', 'lix'
                ORDER BY cg.depth DESC
                ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
            ) AS entity_created_at,
            FIRST_VALUE(cmt.created_at) OVER (
                PARTITION BY 'global', (je.value || '~' || cg.commit_id), 'lix_commit_edge', 'lix'
                ORDER BY cg.depth ASC
                ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
            ) AS entity_updated_at
        FROM internal_materialization_commit_graph cg
        JOIN change cmt ON cmt.entity_id = cg.commit_id AND cmt.schema_key = 'lix_commit'
        JOIN json_each(json_extract(cmt.snapshot_content,'$.parent_commit_ids')) je
        WHERE json_type(json_extract(cmt.snapshot_content,'$.parent_commit_ids')) = 'array'
    ),
    commit_authors AS (
        -- Derive change_author rows per domain change from commit.author_account_ids (global scope)
        SELECT
            'global' AS version_id,
            ct.commit_id,
            ct.depth,
            -- Use the commit change row id for lineage (lixcol_change_id)
            cmt.id AS change_id,
            -- entity key: change_id~account_id (domain change id)
            (c.id || '~' || ja.value) AS entity_id,
            'lix_change_author' AS schema_key,
            'lix' AS file_id,
            'lix_own_entity' AS plugin_key,
            json_object(
                'change_id', c.id,
                'account_id', ja.value
            ) AS snapshot_content,
            '1.0' AS schema_version,
            cmt.created_at AS created_at,
            ROW_NUMBER() OVER (
                PARTITION BY 'global', (c.id || '~' || ja.value), 'lix_change_author', 'lix'
                ORDER BY ct.depth ASC
            ) AS first_seen,
            FIRST_VALUE(cmt.created_at) OVER (
                PARTITION BY 'global', (c.id || '~' || ja.value), 'lix_change_author', 'lix'
                ORDER BY ct.depth DESC
                ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
            ) AS entity_created_at,
            FIRST_VALUE(cmt.created_at) OVER (
                PARTITION BY 'global', (c.id || '~' || ja.value), 'lix_change_author', 'lix'
                ORDER BY ct.depth ASC
                ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
            ) AS entity_updated_at
        FROM commit_targets_distinct ct
        JOIN change cmt ON cmt.entity_id = ct.commit_id AND cmt.schema_key = 'lix_commit'
        JOIN change c ON c.id = ct.target_change_id
        JOIN json_each(json_extract(cmt.snapshot_content,'$.author_account_ids')) ja
        WHERE json_type(json_extract(cmt.snapshot_content,'$.author_account_ids')) = 'array'
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
    WHERE first_seen = 1
    UNION ALL
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
    FROM lvs_version_global
    UNION ALL
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
    FROM commit_rows_global
    WHERE first_seen = 1
    UNION ALL
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
    FROM commit_cse
    WHERE first_seen = 1
    UNION ALL
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
    FROM commit_edges
    WHERE first_seen = 1
    UNION ALL
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
    FROM commit_authors
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
	lix.sqlite.exec(`
		CREATE VIEW IF NOT EXISTS internal_materialization_version_ancestry AS
		WITH RECURSIVE version_ancestry(version_id, ancestor_version_id, inheritance_depth, path) AS (
			-- Each version is its own ancestor at depth 0
			SELECT 
				entity_id as version_id, 
				entity_id as ancestor_version_id, 
				0 as inheritance_depth,
				',' || entity_id || ',' -- Path for cycle detection
			FROM change 
			WHERE schema_key = 'lix_version_descriptor'
			
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
				AND parent_v.schema_key = 'lix_version_descriptor'
			WHERE json_extract(parent_v.snapshot_content,'$.inherits_from_version_id') IS NOT NULL
			  -- Cycle detection: stop if ancestor already in path
			  AND INSTR(va.path, ',' || json_extract(parent_v.snapshot_content,'$.inherits_from_version_id') || ',') = 0
		)
		SELECT version_id, ancestor_version_id, inheritance_depth 
		FROM version_ancestry;
	`);

	// View 5: Final state materializer with multi-level inheritance
	// Ensure latest definition is applied
	lix.sqlite.exec(`
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
