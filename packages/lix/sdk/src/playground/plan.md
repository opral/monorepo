# Playground Notes

## Todos

- [ ] real entity views creation upon insert of schema defintion
- [ ] make all tests pass without any preprocessor being active (vtable has to build query without relying on vtable itself again) 
- [ ] implement with no preprocessor simulation to ensure preprocessor is just an optimization
- [ ] implement pipeline stages
  - [ ] normalize placeholders
  - [ ] expand views
  - [ ] rewrite vtable selects
  - [ ] cache populator

## Pipeline

0. Normalize placeholders

- convert `?` or named parameters to numbered placeholders (`?1`, `?2`, …) as the very first step so downstream stages can reference parameter-bound predicates reliably.

1. Expand views

- do not rewrite. just expand views in place.
- do not hoist. keep things inline to avoid dependencies between statements.

```sql
-- incoming query
SELECT
    "column_a",
    "column_b"
FROM "test_schema"
WHERE "column_a" = 'hello'
  AND "lixcol_version_id" = 'global';

-- step expand sql (inline view, predicates still outside)
SELECT
    "column_a",
    "column_b"
FROM (
    SELECT
        "entity_id" AS "lixcol_id",
        json_extract("snapshot_content", '$.column_a') AS "column_a",
        json_extract("snapshot_content", '$.column_b') AS "column_b",
        "version_id" AS "lixcol_version_id",
        "created_at" AS "lixcol_created_at",
        "updated_at" AS "lixcol_updated_at"
    FROM "lix_internal_state_vtable"
    WHERE "schema_key" = 'test_schema'
) AS "test_schema"
WHERE "column_a" = 'hello'
  AND "lixcol_version_id" = 'global';
```

2. Rewrite vtable selects

- parse and analyze expanded query for vtable rewrites
- provide the step context with a cache preflight (version + schema_key) that are used in the rewrite

```sql
-- step rewrite vtable select (cache swap + predicate pushdown)
SELECT
    "column_a",
    "column_b"
FROM (
    SELECT
        "entity_id" AS "lixcol_id",
        json_extract("snapshot_content", '$.column_a') AS "column_a",
        json_extract("snapshot_content", '$.column_b') AS "column_b",
        "version_id" AS "lixcol_version_id",
        "created_at" AS "lixcol_created_at",
        "updated_at" AS "lixcol_updated_at"
    FROM (
        WITH RECURSIVE
            "params" AS (
                SELECT 'global' AS "version_id"
            ),
            "state_candidates" AS (
                SELECT
                    "cache"."entity_id",
                    "cache"."schema_key",
                    "cache"."snapshot_content",
                    "cache"."created_at",
                    "cache"."updated_at",
                    "cache"."version_id",
                    "cache"."version_id" AS "resolved_version_id",
                    NULL AS "inherited_from_version_id",
                    1 AS "priority"
                FROM "lix_internal_state_cache_v1_test_schema" AS "cache"
                JOIN "params" ON "params"."version_id" = "cache"."version_id"
                WHERE "cache"."schema_key" = 'test_schema'
                  AND json_extract("cache"."snapshot_content", '$.column_a') = 'hello'

                UNION ALL

                SELECT
                    "cache"."entity_id",
                    "cache"."schema_key",
                    "cache"."snapshot_content",
                    "cache"."created_at",
                    "cache"."updated_at",
                    "cache"."version_id",
                    "version_inheritance"."version_id" AS "resolved_version_id",
                    "cache"."version_id" AS "inherited_from_version_id",
                    2 AS "priority"
                FROM "lix_internal_state_cache_v1_test_schema" AS "cache"
                JOIN (
                    SELECT
                        "params"."version_id",
                        "descriptor"."parent_version_id" AS "ancestor_version_id"
                    FROM "params"
                    JOIN (
                        SELECT
                            json_extract("desc"."snapshot_content", '$.id') AS "version_id",
                            json_extract(
                                "desc"."snapshot_content",
                                '$.inherits_from_version_id'
                            ) AS "parent_version_id"
                        FROM "lix_internal_state_cache_v1_lix_version_descriptor" AS "desc"
                    ) AS "descriptor"
                        ON "descriptor"."version_id" = "params"."version_id"
                    WHERE "descriptor"."parent_version_id" IS NOT NULL
                ) AS "version_inheritance"
                    ON "cache"."version_id" = "version_inheritance"."ancestor_version_id"
                WHERE "cache"."schema_key" = 'test_schema'
                  AND json_extract("cache"."snapshot_content", '$.column_a') = 'hello'
            ),
            "state_ranked" AS (
                SELECT
                    "state_candidates".*,
                    ROW_NUMBER() OVER (
                        PARTITION BY "entity_id", "schema_key", "resolved_version_id"
                        ORDER BY "priority", "updated_at" DESC, "version_id"
                    ) AS "rn"
                FROM "state_candidates"
            )
        SELECT
            "entity_id",
            "resolved_version_id" AS "version_id",
            "schema_key",
            "snapshot_content",
            "created_at",
            "updated_at"
        FROM "state_ranked"
        WHERE "rn" = 1
            AND "schema_key" = 'test_schema'
            AND json_extract("snapshot_content", '$.column_a') = 'hello'
            AND "version_id" = 'global'
    ) AS "lix_internal_state_vtable"
) AS "test_schema"
WHERE "column_a" = 'hello'
  AND "lixcol_version_id" = 'global';
```

3. Cache populator

- consumes the cache preflight info from the vtable rewrite step
- populates the cache as needed prior to executing the rewritten query
