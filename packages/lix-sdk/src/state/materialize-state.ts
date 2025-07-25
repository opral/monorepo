import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export function applyMaterializeStateSchema(sqlite: SqliteWasmDatabase): void {
	// View 1: All changes including untracked
	sqlite.exec(`
		CREATE VIEW IF NOT EXISTS internal_materialization_all_changes AS
		SELECT 
			c.id,
			c.entity_id,
			c.schema_key,
			c.file_id,
			c.plugin_key,
			c.schema_version,
			c.created_at,
			c.snapshot_content
		FROM change c

		UNION ALL

		SELECT 
			'untracked-'||unt.entity_id||'-'||unt.schema_key AS id,
			unt.entity_id,
			unt.schema_key,
			unt.file_id,
			unt.plugin_key,
			unt.schema_version,
			unt.created_at,
			json(unt.snapshot_content) AS snapshot_content
		FROM internal_state_all_untracked unt;
	`);

	// View 2: Version change set roots - only the latest change for each version
	sqlite.exec(`
		CREATE VIEW IF NOT EXISTS internal_materialization_version_roots AS
		SELECT 
			json_extract(v.snapshot_content,'$.change_set_id') AS tip_change_set_id,
			v.entity_id AS version_id
		FROM internal_materialization_all_changes v
		WHERE v.schema_key = 'lix_version'
		  AND NOT EXISTS (
			-- Exclude if there's a newer change for the same version
			SELECT 1 
			FROM internal_materialization_all_changes newer
			WHERE newer.entity_id = v.entity_id
			  AND newer.schema_key = 'lix_version'
			  AND newer.created_at > v.created_at
		  );
	`);

	// View 3: Change set lineage (recursive - includes ancestors)
	sqlite.exec(`
		CREATE VIEW IF NOT EXISTS internal_materialization_lineage AS
		WITH RECURSIVE lineage_cs(id, version_id) AS (
			/* anchor: the tip itself */
			SELECT 
				tip_change_set_id, 
				version_id 
			FROM internal_materialization_version_roots

			UNION

			/* recurse upwards via parent_id - collects only ancestors */
			SELECT 
				json_extract(edge.snapshot_content,'$.parent_id') AS id,
				l.version_id AS version_id
			FROM internal_materialization_all_changes edge
			JOIN lineage_cs l ON json_extract(edge.snapshot_content,'$.child_id') = l.id
			WHERE edge.schema_key = 'lix_change_set_edge'
			  AND json_extract(edge.snapshot_content,'$.parent_id') IS NOT NULL
		)
		SELECT * FROM lineage_cs;
	`);

	// View 4: Change set depth calculation
	sqlite.exec(`
		CREATE VIEW IF NOT EXISTS internal_materialization_cs_depth AS
		WITH RECURSIVE cs_depth AS (
			SELECT 
				tip_change_set_id AS id, 
				version_id, 
				0 AS depth 
			FROM internal_materialization_version_roots

			UNION ALL

			SELECT 
				json_extract(edge.snapshot_content,'$.parent_id') AS id,
				d.version_id AS version_id,
				d.depth + 1 AS depth
			FROM internal_materialization_all_changes edge
			JOIN cs_depth d ON json_extract(edge.snapshot_content,'$.child_id') = d.id
			WHERE edge.schema_key = 'lix_change_set_edge'
			  AND json_extract(edge.snapshot_content,'$.parent_id') IS NOT NULL
			  AND EXISTS (
				SELECT 1 FROM internal_materialization_lineage 
				WHERE internal_materialization_lineage.id = json_extract(edge.snapshot_content,'$.parent_id')
				  AND internal_materialization_lineage.version_id = d.version_id
			  )
		)
		SELECT * FROM cs_depth;
	`);

	// View 5: Change set elements in reachable change sets
	sqlite.exec(`
		CREATE VIEW IF NOT EXISTS internal_materialization_cse AS
		SELECT 
			json_extract(ias.snapshot_content,'$.entity_id') AS target_entity_id,
			json_extract(ias.snapshot_content,'$.file_id') AS target_file_id,
			json_extract(ias.snapshot_content,'$.schema_key') AS target_schema_key,
			json_extract(ias.snapshot_content,'$.change_id') AS target_change_id,
			json_extract(ias.snapshot_content,'$.change_set_id') AS cse_origin_change_set_id,
			lcs.version_id
		FROM internal_materialization_all_changes ias
		JOIN internal_materialization_lineage lcs ON json_extract(ias.snapshot_content,'$.change_set_id') = lcs.id
		WHERE ias.schema_key = 'lix_change_set_element';
	`);

	// View 6: Leaf target snapshots (latest change for each entity in each version)
	sqlite.exec(`
		CREATE VIEW IF NOT EXISTS internal_materialization_leaf_snapshots AS
		SELECT 
			target_change.entity_id,
			target_change.schema_key,
			target_change.file_id,
			target_change.plugin_key,
			target_change.snapshot_content,
			target_change.schema_version,
			r.version_id,
			target_change.created_at,
			target_change.id AS change_id,
			r.cse_origin_change_set_id AS change_set_id
		FROM internal_materialization_cse r
		JOIN internal_materialization_all_changes target_change ON r.target_change_id = target_change.id
		WHERE NOT EXISTS (
			/* any *newer* change for the same entity in a *descendant* CS */
			WITH RECURSIVE descendants_of_current_cs(id) AS (
				SELECT r.cse_origin_change_set_id
				UNION
				SELECT json_extract(edge.snapshot_content,'$.child_id')
				FROM internal_materialization_all_changes edge
				JOIN descendants_of_current_cs d ON json_extract(edge.snapshot_content,'$.parent_id') = d.id
				WHERE edge.schema_key = 'lix_change_set_edge'
				  AND json_extract(edge.snapshot_content,'$.child_id') IN (
						 SELECT id FROM internal_materialization_lineage WHERE version_id = r.version_id
					   )
			)
			SELECT 1
			FROM internal_materialization_cse newer_r
			WHERE newer_r.target_entity_id  = r.target_entity_id
			  AND newer_r.target_file_id    = r.target_file_id
			  AND newer_r.target_schema_key = r.target_schema_key
			  AND newer_r.version_id        = r.version_id
			  AND newer_r.target_change_id != r.target_change_id
			  AND newer_r.cse_origin_change_set_id IN descendants_of_current_cs
		);
	`);

	// View 7: Version inheritance relationships
	sqlite.exec(`
		CREATE VIEW IF NOT EXISTS internal_materialization_version_inheritance AS
		SELECT DISTINCT 
			v.entity_id AS version_id,
			json_extract(v.snapshot_content,'$.inherits_from_version_id') AS parent_version_id
		FROM internal_materialization_all_changes v
		WHERE v.schema_key = 'lix_version';
	`);

	// View 8: All entities (direct and inherited)
	sqlite.exec(`
		CREATE VIEW IF NOT EXISTS internal_materialization_all_entities AS
		/* direct */
		SELECT 
			entity_id, 
			schema_key, 
			file_id, 
			plugin_key, 
			snapshot_content, 
			schema_version,
			version_id, 
			version_id AS visible_in_version, 
			NULL AS inherited_from_version_id,
			created_at, 
			change_id, 
			change_set_id
		FROM internal_materialization_leaf_snapshots

		UNION ALL

		/* inherited */
		SELECT 
			ls.entity_id, 
			ls.schema_key, 
			ls.file_id, 
			ls.plugin_key, 
			ls.snapshot_content, 
			ls.schema_version,
			vi.version_id, 
			vi.version_id AS visible_in_version, 
			vi.parent_version_id AS inherited_from_version_id,
			ls.created_at, 
			ls.change_id, 
			ls.change_set_id
		FROM internal_materialization_version_inheritance vi
		JOIN internal_materialization_leaf_snapshots ls ON ls.version_id = vi.parent_version_id
		WHERE vi.parent_version_id IS NOT NULL
		  AND ls.snapshot_content IS NOT NULL /* don't inherit deletions */
		  AND ls.schema_key != 'lix_version' /* don't inherit version entities */
		  AND NOT EXISTS (
		  /* child already changed this entity */
		  SELECT 1 FROM internal_materialization_leaf_snapshots child_ls
		  WHERE child_ls.version_id = vi.version_id
			AND child_ls.entity_id  = ls.entity_id
			AND child_ls.schema_key = ls.schema_key
			AND child_ls.file_id    = ls.file_id
		  );
	`);

	// View 9: Prioritized entities (with deduplication logic)
	sqlite.exec(`
		CREATE VIEW IF NOT EXISTS internal_materialization_prioritized_entities AS
		SELECT *,
			ROW_NUMBER() OVER (
				PARTITION BY entity_id, schema_key, file_id, visible_in_version
				ORDER BY CASE WHEN inherited_from_version_id IS NULL THEN 1 ELSE 2 END,
						(
							SELECT depth
							FROM internal_materialization_cs_depth
							WHERE internal_materialization_cs_depth.id = change_set_id
							  AND internal_materialization_cs_depth.version_id = visible_in_version
						) DESC,
						change_id DESC  /* deterministic fall-back, should rarely fire */
			) AS rn
		FROM internal_materialization_all_entities
		WHERE snapshot_content IS NOT NULL;
	`);
}

export function materializeState(
	sqlite: SqliteWasmDatabase,
	filters: Record<string, string>,
	includeDeletions: boolean = false
): any[] {
	let sql = `
    /* -----------------------------  CTEs  --------------------------------- */
    WITH
      /*  Collect every committed or in-flight change with its snapshot */
      all_changes_with_snapshots AS (
        SELECT * FROM internal_materialization_all_changes
      ),

      /* Discover every change-set in the lineage of each version's tip */
      /* (tip + all ancestors, but not descendant branches) */
      root_cs_of_all_versions AS (
        SELECT * FROM internal_materialization_version_roots
      ),
      lineage_cs AS (
        SELECT * FROM internal_materialization_lineage
      ),

      /* Calculate depth: 0 = tip, 1 = parent, etc */
      cs_depth AS (
        SELECT * FROM internal_materialization_cs_depth
      ),

      /* Map entities that belong to those change-sets */
      cse_in_reachable_cs AS (
        SELECT * FROM internal_materialization_cse
      ),

      /* Select the leaf change for every entity in every version */
      leaf_target_snapshots AS (
        SELECT * FROM internal_materialization_leaf_snapshots
      ),

      /* Version inheritance */
      version_inheritance AS (
        SELECT * FROM internal_materialization_version_inheritance
      ),

      /* Combine direct and inherited entities */
      all_entities AS (
        SELECT * FROM internal_materialization_all_entities
      ),

      /* Deduplicate: prefer direct, then deepest CS */
      prioritized_entities AS (
        SELECT *,
             ROW_NUMBER() OVER (
               PARTITION BY entity_id, schema_key, file_id, visible_in_version
               ORDER BY CASE WHEN inherited_from_version_id IS NULL THEN 1 ELSE 2 END,
                        (
                          SELECT depth
                          FROM   internal_materialization_cs_depth
                          WHERE  internal_materialization_cs_depth.id = change_set_id
                            AND  internal_materialization_cs_depth.version_id = visible_in_version
                        ) DESC,
                        change_id DESC  /* deterministic fall-back, should rarely fire */
             ) AS rn
        FROM   internal_materialization_all_entities
        ${includeDeletions ? `` : `WHERE snapshot_content IS NOT NULL`}
      )
    /* ---------------------- final projection ------------------------------ */
    SELECT 
      pe.entity_id,
      pe.schema_key,
      pe.file_id,
      pe.plugin_key,
      pe.snapshot_content,
      pe.schema_version,
      pe.version_id,
      COALESCE(
        (SELECT MIN(ac.created_at) 
         FROM all_changes_with_snapshots ac
         JOIN cse_in_reachable_cs cse 
           ON cse.target_change_id = ac.id
         WHERE ac.entity_id = pe.entity_id 
           AND ac.schema_key = pe.schema_key 
           AND ac.file_id = pe.file_id
           AND cse.version_id = pe.version_id),
        pe.created_at
      ) AS created_at,
      COALESCE(
        (SELECT MAX(ac.created_at) 
         FROM all_changes_with_snapshots ac
         JOIN cse_in_reachable_cs cse 
           ON cse.target_change_id = ac.id
         WHERE ac.entity_id = pe.entity_id 
           AND ac.schema_key = pe.schema_key 
           AND ac.file_id = pe.file_id
           AND cse.version_id = pe.version_id),
        pe.created_at
      ) AS updated_at,
      pe.inherited_from_version_id,
      pe.change_id,
      COALESCE(pe.change_set_id,'untracked') AS change_set_id
    FROM prioritized_entities pe
    WHERE pe.rn = 1
  `;

	/* ------------------------ dynamic filters ------------------------------ */
	const bindings: string[] = [];
	Object.entries(filters).forEach(([col, val]) => {
		sql += `\n      AND ${col} = ?`;
		bindings.push(val);
	});

	return sqlite.exec({ sql, bind: bindings, returnValue: "resultRows" });
}
