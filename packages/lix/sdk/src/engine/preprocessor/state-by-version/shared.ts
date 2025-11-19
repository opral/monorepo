export const STATE_BY_VERSION_VIEW = "state_by_version";

export const WRITABLE_COLUMNS: readonly [
	"entity_id",
	"schema_key",
	"file_id",
	"version_id",
	"plugin_key",
	"snapshot_content",
	"schema_version",
	"inherited_from_version_id",
	"metadata",
	"untracked",
] = [
	"entity_id",
	"schema_key",
	"file_id",
	"version_id",
	"plugin_key",
	"snapshot_content",
	"schema_version",
	"inherited_from_version_id",
	"metadata",
	"untracked",
] as const;

export const REQUIRED_WRITABLE_COLUMNS: ReadonlySet<string> = new Set(
	WRITABLE_COLUMNS.slice(0, 7 /* required subset */)
);

const SKIPPABLE_COLUMN_NAMES: readonly [
	"created_at",
	"updated_at",
	"change_id",
	"commit_id",
	"writer_key",
	"source_tag",
] = [
	"created_at",
	"updated_at",
	"change_id",
	"commit_id",
	"writer_key",
	"source_tag",
] as const;

export const SKIPPABLE_COLUMNS: ReadonlySet<string> = new Set(
	SKIPPABLE_COLUMN_NAMES
);

export const ALLOWED_COLUMNS: ReadonlySet<string> = new Set<string>([
	...WRITABLE_COLUMNS,
	...SKIPPABLE_COLUMN_NAMES,
]);

export const OPTIONAL_INSERT_COLUMNS: readonly [
	"inherited_from_version_id",
	"metadata",
	"untracked",
] = ["inherited_from_version_id", "metadata", "untracked"] as const;
