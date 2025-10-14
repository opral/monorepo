export const PRIMARY_KEY_COLUMNS = [
	"entity_id",
	"file_id",
	"version_id",
] as const;

export const CACHE_COLUMNS = [
	"entity_id",
	"schema_key",
	"file_id",
	"version_id",
	"plugin_key",
	"schema_version",
	"created_at",
	"updated_at",
	"inherited_from_version_id",
	"is_tombstone",
	"change_id",
	"commit_id",
] as const;
