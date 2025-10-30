{
  sql: `SELECT json_extract(snapshot_content, '$.value') AS value
FROM (
WITH
  version_descriptor_base AS (
    SELECT
      json_extract(desc.snapshot_content, '$.id') AS version_id,
      json_extract(desc.snapshot_content, '$.inherits_from_version_id') AS inherits_from_version_id
    FROM "lix_internal_state_cache_v1_lix_version_descriptor" desc
    WHERE desc.is_tombstone = 0
      AND desc.snapshot_content IS NOT NULL
  ),
  version_inheritance(version_id, ancestor_version_id) AS (
    SELECT
      vdb.version_id,
      vdb.inherits_from_version_id
    FROM version_descriptor_base vdb
    WHERE vdb.inherits_from_version_id IS NOT NULL

    UNION ALL

    SELECT
      vi.version_id,
      vdb.inherits_from_version_id
    FROM version_inheritance vi
    JOIN version_descriptor_base vdb ON vdb.version_id = vi.ancestor_version_id
    WHERE vdb.inherits_from_version_id IS NOT NULL
  ),
  version_parent AS (
    SELECT
      vdb.version_id,
      vdb.inherits_from_version_id AS parent_version_id
    FROM version_descriptor_base vdb
    WHERE vdb.inherits_from_version_id IS NOT NULL
  ),
  candidates AS (
     SELECT
       unt.entity_id AS entity_id,
       unt.schema_key AS schema_key,
       unt.file_id AS file_id,
       unt.version_id AS version_id,
       unt.created_at AS created_at,
       'untracked' AS change_id,
       2 AS priority
     FROM lix_internal_state_all_untracked unt
     WHERE unt.schema_key IN ('lix_key_value')

         UNION ALL

     SELECT
       cache.entity_id AS entity_id,
       cache.schema_key AS schema_key,
       cache.file_id AS file_id,
       cache.version_id AS version_id,
       cache.created_at AS created_at,
       cache.change_id AS change_id,
       3 AS priority
     FROM "lix_internal_state_cache_v1_lix_key_value" cache
     WHERE cache.is_tombstone = 0 AND cache.schema_key IN ('lix_key_value')

         UNION ALL

     SELECT
       cache.entity_id AS entity_id,
       cache.schema_key AS schema_key,
       cache.file_id AS file_id,
       vi.version_id AS version_id,
       cache.created_at AS created_at,
       cache.change_id AS change_id,
       4 AS priority
     FROM version_inheritance vi
     JOIN "lix_internal_state_cache_v1_lix_key_value" cache ON cache.version_id = vi.ancestor_version_id
     WHERE cache.is_tombstone = 0
       AND cache.snapshot_content IS NOT NULL AND cache.schema_key IN ('lix_key_value')

         UNION ALL

     SELECT
       unt.entity_id AS entity_id,
       unt.schema_key AS schema_key,
       unt.file_id AS file_id,
       vi.version_id AS version_id,
       unt.created_at AS created_at,
       'untracked' AS change_id,
       5 AS priority
     FROM version_inheritance vi
     JOIN lix_internal_state_all_untracked unt ON unt.version_id = vi.ancestor_version_id
     WHERE unt.is_tombstone = 0
       AND unt.snapshot_content IS NOT NULL AND unt.schema_key IN ('lix_key_value')
  ),
  ranked AS (
     SELECT
       c.entity_id AS entity_id,
       c.schema_key AS schema_key,
       c.file_id AS file_id,
       c.version_id AS version_id,
       c.created_at AS created_at,
       c.change_id AS change_id,
       c.priority AS priority,
     ROW_NUMBER() OVER (
         PARTITION BY c.file_id, c.schema_key, c.entity_id, c.version_id
         ORDER BY c.priority, c.created_at DESC, c.file_id, c.schema_key, c.entity_id, c.version_id, c.change_id
       ) AS rn
     FROM candidates c
  )
SELECT
  "w".*
FROM ranked w



WHERE w.rn = 1
) AS "lix_internal_state_vtable_rewritten"
WHERE entity_id = ? AND schema_key = ? AND version_id = ? AND snapshot_content IS NOT NULL`,
  parameters: [
    "lix_state_cache_stale",
    "lix_key_value",
    "global",
  ],
  expandedSql: undefined,
  context: {
    getStoredSchemas: () => {
      return loadStoredSchemas();
    },
    getCacheTables: () => {
      return loadCacheTables();
    },
    getSqlViews: () => {
      if (!sqlViews) {
        sqlViews = loadSqlViewMap(engine);
      };
      return sqlViews;
    },
    hasOpenTransaction: () => {
      if (transactionState === void 0) {
        transactionState = (0,__vite_ssr_import_5__.hasOpenTransaction)(engine);
      };
      return transactionState;
    },
    getCelEnvironment: () => {
      if (!celEnvironment) {
        celEnvironment = (0,__vite_ssr_import_6__.createCelEnvironment)({ engine });
      };
      return celEnvironment ?? null;
    },
    getEngine: () => engine,
  },
}