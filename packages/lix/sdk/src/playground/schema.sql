-- Minimal playground scaffolding to reason about the v4 preprocessor.
-- vtable -> state -> entity_view

CREATE TABLE IF NOT EXISTS "lix_internal_state_vtable" (
	"entity_id" TEXT NOT NULL,
	"version_id" TEXT NOT NULL,
	"schema_key" TEXT NOT NULL,
	"snapshot_content" TEXT NOT NULL,
	"created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "lix_internal_state_cache_v1_test_schema" (
	"entity_id" TEXT NOT NULL,
	"schema_key" TEXT NOT NULL,
	"file_id" TEXT NOT NULL,
	"version_id" TEXT NOT NULL,
	"plugin_key" TEXT NOT NULL,
	"snapshot_content" BLOB,
	"schema_version" TEXT NOT NULL,
	"created_at" TEXT NOT NULL,
	"updated_at" TEXT NOT NULL,
	"inherited_from_version_id" TEXT,
	"is_tombstone" INTEGER DEFAULT 0,
	"change_id" TEXT,
	"commit_id" TEXT,
	PRIMARY KEY ("entity_id", "file_id", "version_id")
) STRICT, WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS "lix_internal_state_cache_v1_other_schema" (
	"entity_id" TEXT NOT NULL,
	"schema_key" TEXT NOT NULL,
	"file_id" TEXT NOT NULL,
	"version_id" TEXT NOT NULL,
	"plugin_key" TEXT NOT NULL,
	"snapshot_content" BLOB,
	"schema_version" TEXT NOT NULL,
	"created_at" TEXT NOT NULL,
	"updated_at" TEXT NOT NULL,
	"inherited_from_version_id" TEXT,
	"is_tombstone" INTEGER DEFAULT 0,
	"change_id" TEXT,
	"commit_id" TEXT,
	PRIMARY KEY ("entity_id", "file_id", "version_id")
) STRICT, WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS "lix_internal_state_cache_v1_lix_version_descriptor" (
	"entity_id" TEXT NOT NULL,
	"schema_key" TEXT NOT NULL,
	"file_id" TEXT NOT NULL,
	"version_id" TEXT NOT NULL,
	"plugin_key" TEXT NOT NULL,
	"snapshot_content" BLOB,
	"schema_version" TEXT NOT NULL,
	"created_at" TEXT NOT NULL,
	"updated_at" TEXT NOT NULL,
	"inherited_from_version_id" TEXT,
	"is_tombstone" INTEGER DEFAULT 0,
	"change_id" TEXT,
	"commit_id" TEXT,
	PRIMARY KEY ("entity_id", "file_id", "version_id")
) STRICT, WITHOUT ROWID;

CREATE VIEW IF NOT EXISTS "state" AS
SELECT
	"entity_id",
	"version_id",
	"schema_key",
	"snapshot_content",
	"created_at",
	"updated_at"
FROM "lix_internal_state_vtable"
WHERE "schema_key" = 'test_schema';


CREATE VIEW IF NOT EXISTS "test_schema" AS
SELECT
	"entity_id" AS "lixcol_id",
	json_extract("snapshot_content", '$.column_a') AS "column_a",
	json_extract("snapshot_content", '$.column_b') AS "column_b",
	"version_id" AS "lixcol_version_id",
	"created_at" AS "lixcol_created_at",
	"updated_at" AS "lixcol_updated_at"
FROM "state"
WHERE "schema_key" = 'test_schema';


CREATE VIEW IF NOT EXISTS "other_state" AS
SELECT
	"entity_id",
	"version_id",
	"schema_key",
	"snapshot_content",
	"created_at",
	"updated_at"
FROM "lix_internal_state_vtable"
WHERE "schema_key" = 'other_schema';


CREATE VIEW IF NOT EXISTS "other_schema" AS
SELECT
	"entity_id" AS "lixcol_id",
	json_extract("snapshot_content", '$.column_a') AS "column_a",
	json_extract("snapshot_content", '$.column_b') AS "column_b",
	"version_id" AS "lixcol_version_id",
	"created_at" AS "lixcol_created_at",
	"updated_at" AS "lixcol_updated_at"
FROM "other_state"
WHERE "schema_key" = 'other_schema';
