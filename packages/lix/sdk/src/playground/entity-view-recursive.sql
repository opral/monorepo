-- incoming query
WITH RECURSIVE
	"graph" AS (
		SELECT
			"lixcol_id",
			"column_a",
			"column_b",
			"lixcol_version_id",
			0 AS "depth"
		FROM "test_schema"
		WHERE "lixcol_id" = 'root'
			AND "lixcol_version_id" = 'global'

		UNION ALL

		SELECT
			"child"."lixcol_id",
			"child"."column_a",
			"child"."column_b",
			"child"."lixcol_version_id",
			"graph"."depth" + 1 AS "depth"
		FROM "test_schema" AS "child"
		JOIN "graph" ON json_extract("child"."column_b", '$.parent') = "graph"."lixcol_id"
			AND "child"."lixcol_version_id" = "graph"."lixcol_version_id"
	)
SELECT *
FROM "graph";

-- step expand sql (inline view)
WITH RECURSIVE
	"graph" AS (
		SELECT
			"test_schema"."lixcol_id",
			"test_schema"."column_a",
			"test_schema"."column_b",
			"test_schema"."lixcol_version_id",
			0 AS "depth"
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
		WHERE "test_schema"."lixcol_id" = 'root'
			AND "test_schema"."lixcol_version_id" = 'global'

		UNION ALL

		SELECT
			"child"."lixcol_id",
			"child"."column_a",
			"child"."column_b",
			"child"."lixcol_version_id",
			"graph"."depth" + 1 AS "depth"
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
		) AS "child"
		JOIN "graph" ON json_extract("child"."column_b", '$.parent') = "graph"."lixcol_id"
			AND "child"."lixcol_version_id" = "graph"."lixcol_version_id"
	)
SELECT *
FROM "graph";

-- step rewrite vtable select (inline cache + inheritance)
WITH RECURSIVE
	"graph" AS (
		SELECT
			"test_schema"."lixcol_id",
			"test_schema"."column_a",
			"test_schema"."column_b",
			"test_schema"."lixcol_version_id",
			0 AS "depth"
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
					"version_descriptor_base" AS (
						SELECT
							json_extract("desc"."snapshot_content", '$.id') AS "version_id",
							json_extract(
								"desc"."snapshot_content",
								'$.inherits_from_version_id'
							) AS "parent_version_id"
						FROM "lix_internal_state_cache_v1_lix_version_descriptor" AS "desc"
					),
					"version_inheritance" AS (
						SELECT
							"params"."version_id",
							"version_descriptor_base"."parent_version_id" AS "ancestor_version_id"
						FROM "params"
						JOIN "version_descriptor_base" ON
							"version_descriptor_base"."version_id" = "params"."version_id"
						WHERE "version_descriptor_base"."parent_version_id" IS NOT NULL

						UNION ALL

						SELECT
							"version_inheritance"."version_id",
							"version_descriptor_base"."parent_version_id" AS "ancestor_version_id"
						FROM "version_inheritance"
						JOIN "version_descriptor_base" ON
							"version_descriptor_base"."version_id" = "version_inheritance"."ancestor_version_id"
						WHERE "version_descriptor_base"."parent_version_id" IS NOT NULL
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
						JOIN "version_inheritance" ON
							"cache"."version_id" = "version_inheritance"."ancestor_version_id"
						WHERE "cache"."schema_key" = 'test_schema'
					),
					"state_ranked" AS (
						SELECT
							"state_candidates"."entity_id",
							"state_candidates"."schema_key",
							"state_candidates"."snapshot_content",
							"state_candidates"."created_at",
							"state_candidates"."updated_at",
							"state_candidates"."resolved_version_id" AS "version_id",
							"state_candidates"."inherited_from_version_id",
							ROW_NUMBER() OVER (
								PARTITION BY
									"state_candidates"."entity_id",
									"state_candidates"."schema_key",
									"state_candidates"."resolved_version_id"
								ORDER BY
									"state_candidates"."priority",
									"state_candidates"."updated_at" DESC,
									"state_candidates"."version_id"
							) AS "rn"
						FROM "state_candidates"
					)
				SELECT
					"entity_id",
					"version_id",
					"schema_key",
					"snapshot_content",
					"created_at",
					"updated_at"
				FROM "state_ranked"
				WHERE "rn" = 1
			) AS "lix_internal_state_vtable"
			WHERE "schema_key" = 'test_schema'
		) AS "test_schema"
		WHERE "test_schema"."lixcol_id" = 'root'
			AND "test_schema"."lixcol_version_id" = 'global'

		UNION ALL

		SELECT
			"child"."lixcol_id",
			"child"."column_a",
			"child"."column_b",
			"child"."lixcol_version_id",
			"graph"."depth" + 1 AS "depth"
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
					"version_descriptor_base" AS (
						SELECT
							json_extract("desc"."snapshot_content", '$.id') AS "version_id",
							json_extract(
								"desc"."snapshot_content",
								'$.inherits_from_version_id'
							) AS "parent_version_id"
						FROM "lix_internal_state_cache_v1_lix_version_descriptor" AS "desc"
					),
					"version_inheritance" AS (
						SELECT
							"params"."version_id",
							"version_descriptor_base"."parent_version_id" AS "ancestor_version_id"
						FROM "params"
						JOIN "version_descriptor_base" ON
							"version_descriptor_base"."version_id" = "params"."version_id"
						WHERE "version_descriptor_base"."parent_version_id" IS NOT NULL

						UNION ALL

						SELECT
							"version_inheritance"."version_id",
							"version_descriptor_base"."parent_version_id" AS "ancestor_version_id"
						FROM "version_inheritance"
						JOIN "version_descriptor_base" ON
							"version_descriptor_base"."version_id" = "version_inheritance"."ancestor_version_id"
						WHERE "version_descriptor_base"."parent_version_id" IS NOT NULL
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
						JOIN "version_inheritance" ON
							"cache"."version_id" = "version_inheritance"."ancestor_version_id"
						WHERE "cache"."schema_key" = 'test_schema'
					),
					"state_ranked" AS (
						SELECT
							"state_candidates"."entity_id",
							"state_candidates"."schema_key",
							"state_candidates"."snapshot_content",
							"state_candidates"."created_at",
							"state_candidates"."updated_at",
							"state_candidates"."resolved_version_id" AS "version_id",
							"state_candidates"."inherited_from_version_id",
							ROW_NUMBER() OVER (
								PARTITION BY
									"state_candidates"."entity_id",
									"state_candidates"."schema_key",
									"state_candidates"."resolved_version_id"
								ORDER BY
									"state_candidates"."priority",
									"state_candidates"."updated_at" DESC,
									"state_candidates"."version_id"
							) AS "rn"
						FROM "state_candidates"
					)
				SELECT
					"entity_id",
					"version_id",
					"schema_key",
					"snapshot_content",
					"created_at",
					"updated_at"
				FROM "state_ranked"
				WHERE "rn" = 1
			) AS "lix_internal_state_vtable"
			WHERE "schema_key" = 'test_schema'
		) AS "child"
		JOIN "graph" ON json_extract("child"."column_b", '$.parent') = "graph"."lixcol_id"
			AND "child"."lixcol_version_id" = "graph"."lixcol_version_id"
	)
SELECT *
FROM "graph";
