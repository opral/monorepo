select * from (
WITH
  -- Hoisted lix_internal_state_vtable definition (shared by downstream view rewrites)
  lix_internal_state_vtable AS (
    SELECT
      entity_id,
      schema_key,
      file_id,
      plugin_key,
      snapshot_content,
      schema_version,
      version_id,
      created_at,
      updated_at,
      inherited_from_version_id,
      change_id,
      untracked,
      commit_id,
      metadata,
      writer_key
    FROM lix_internal_state_vtable_rewritten
  ),
  -- Source side should expose explicit deletions (tombstones)
  -- Use state_with_tombstones to include rows with NULL snapshot_content
  s AS (
    SELECT entity_id, schema_key, file_id, change_id, commit_id, version_id, snapshot_content
    FROM lix_internal_state_vtable
    WHERE version_id = 'test_0000000017'
  ),
  t AS (
    SELECT entity_id, schema_key, file_id, change_id, commit_id, version_id
    FROM lix_internal_state_vtable
    WHERE snapshot_content IS NOT NULL
      AND version_id = 'test_0000000047'
  ),
  joined AS (
    SELECT
      COALESCE(s.entity_id, t.entity_id) AS entity_id,
      COALESCE(s.schema_key, t.schema_key) AS schema_key,
      COALESCE(s.file_id, t.file_id) AS file_id,
      t.version_id AS before_version_id,
      t.change_id AS before_change_id,
      t.commit_id AS before_commit_id,
      s.version_id AS after_version_id,
      s.change_id AS after_change_id,
      s.commit_id AS after_commit_id,
      CASE
        -- Explicit delete in source (tombstone takes precedence)
        WHEN s.snapshot_content IS NULL THEN 'removed'
        -- Added in source only (live row)
        WHEN t.change_id IS NULL AND s.snapshot_content IS NOT NULL THEN 'added'
        -- Both present and different (live row in source)
        WHEN t.change_id IS NOT NULL AND s.snapshot_content IS NOT NULL AND s.change_id != t.change_id THEN 'modified'
        -- Both present and same (live row in source)
        ELSE 'unchanged'
      END AS status
    FROM s
    LEFT JOIN t ON t.entity_id = s.entity_id AND t.schema_key = s.schema_key AND t.file_id = s.file_id
    UNION ALL
    SELECT
      COALESCE(s.entity_id, t.entity_id) AS entity_id,
      COALESCE(s.schema_key, t.schema_key) AS schema_key,
      COALESCE(s.file_id, t.file_id) AS file_id,
      t.version_id AS before_version_id,
      t.change_id AS before_change_id,
      t.commit_id AS before_commit_id,
      -- For target-only rows (no source contribution), mirror target values for after_*
      -- This represents entities that exist in target but were never in source
      t.version_id AS after_version_id,
      t.change_id AS after_change_id,
      t.commit_id AS after_commit_id,
      CASE
        -- Target-only: entity exists in target but never existed in source (no explicit delete)
        -- Treated as unchanged since source doesn't modify it
        WHEN s.change_id IS NULL AND t.change_id IS NOT NULL THEN 'unchanged'
        ELSE 'unchanged'
      END AS status
    FROM t
    LEFT JOIN s ON s.entity_id = t.entity_id AND s.schema_key = t.schema_key AND s.file_id = t.file_id
    WHERE s.change_id IS NULL
  )
SELECT *
FROM joined
    ) as "diff" where "diff"."status" != ?
