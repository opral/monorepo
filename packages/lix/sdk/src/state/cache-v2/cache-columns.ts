export const PRIMARY_KEY_COLUMNS = [
	"lixcol_entity_id",
	"lixcol_file_id",
	"lixcol_version_id",
] as const;

export const CACHE_COLUMNS = [
	"lixcol_entity_id",
	"lixcol_schema_key",
	"lixcol_file_id",
	"lixcol_version_id",
	"lixcol_plugin_key",
	"lixcol_schema_version",
	"lixcol_created_at",
	"lixcol_updated_at",
	"lixcol_inherited_from_version_id",
	"lixcol_is_tombstone",
	"lixcol_change_id",
	"lixcol_commit_id",
] as const;
