import { plugin as mdPlugin } from "../../lix/plugin-md/dist";
import type { Lix } from "@lix-js/sdk";
import { sql, ebEntity } from "@lix-js/sdk";
import { AstSchemas } from "@opral/markdown-wc";

// Files
export function selectFiles(lix: Lix) {
	return lix.db
		.selectFrom("file")
		.select(["id", "path"]) // minimal row for explorer
		.orderBy("path", "asc");
}

export type FilesystemEntryRow = {
	id: string;
	parent_id: string | null;
	path: string;
	display_name: string;
	kind: "directory" | "file";
	hidden: number;
};

/**
 * Unified filesystem listing containing both directories and files ordered by path.
 *
 * Each row represents either a directory (with `kind === "directory"`) or a file
 * (`kind === "file"`) and is shaped to make tree construction straightforward on
 * the client.
 */
export function selectFilesystemEntries(lix: Lix) {
	return lix.db
		.selectFrom("directory")
		.select((eb) => [
			eb.ref("directory.id").as("id"),
			eb.ref("directory.parent_id").as("parent_id"),
			eb.ref("directory.path").as("path"),
			eb.ref("directory.name").as("display_name"),
			sql<string>`'directory'`.as("kind"),
			eb.ref("directory.hidden").as("hidden"),
		])
		.unionAll(
			lix.db.selectFrom("file").select((eb) => [
				eb.ref("file.id").as("id"),
				eb.ref("file.directory_id").as("parent_id"),
				eb.ref("file.path").as("path"),
				sql<string>`CASE
						WHEN file.extension IS NULL OR file.extension = ''
							THEN file.name
						ELSE file.name || '.' || file.extension
					END`.as("display_name"),
				sql<string>`'file'`.as("kind"),
				eb.ref("file.hidden").as("hidden"),
			]),
		)
		.orderBy("path", "asc")
		.$castTo<FilesystemEntryRow>();
}

/**
 * Aggregated working diff counts for the active file.
 *
 * The query scopes the change-set elements to the version's current working commit
 * so that live observers reset when checkpoints promote a new commit. Markdown
 * root-order changes are excluded to avoid counting pure reorders.
 *
 * @example
 * const counts = await selectWorkingDiffCount(lix).executeTakeFirst();
 * console.log(counts?.total ?? 0);
 */
export function selectWorkingDiffCount(lix: Lix) {
	const activeFileIdQ = lix.db
		.selectFrom("key_value")
		.where("key", "=", "flashtype_active_file_id")
		.select("value");

	return selectDiffCount({
		lix,
		changeSetId: sql.ref("commit.change_set_id"),
	})
		.innerJoin(
			"commit",
			"commit.change_set_id",
			"change_set_element.change_set_id",
		)
		.innerJoin("change_set", "change_set.id", "commit.change_set_id")
		.innerJoin("version", "version.working_commit_id", "commit.id")
		.innerJoin("active_version", "active_version.version_id", "version.id")
		.where("change_set_element.file_id", "=", activeFileIdQ);
}

/**
 * Selects checkpoint change sets for the active file with aggregated diff counts.
 *
 * Returns each checkpoint with:
 * - id: change_set id
 * - commit_id: the associated commit id
 * - checkpoint_created_at: timestamp when the checkpoint label was created
 * - added: count of changes with non-null snapshot_content (insert/update)
 * - removed: count of changes with null snapshot_content (delete)
 *
 * Notes:
 * - Scoped to the currently active file via key_value("flashtype_active_file_id").
 * - Counts include only Markdown plugin changes and exclude RootOrder schema (reorders).
 */
export function selectCheckpoints({ lix }: { lix: Lix }) {
	return (
		lix.db
			.selectFrom("change_set")
			// Only labelled checkpoints
			.innerJoin("commit", "commit.change_set_id", "change_set.id")
			// Join commit for metadata
			.where(ebEntity("commit").hasLabel({ name: "checkpoint" }))
			// Aggregate counts per file within the change set
			.leftJoin(
				"change_set_element",
				"change_set.id",
				"change_set_element.change_set_id",
			)
			.leftJoin("change", "change.id", "change_set_element.change_id")
			.groupBy(["change_set.id", "commit.id"])
			.select(["change_set.id"])
			.select((eb) => eb.ref("commit.id").as("commit_id"))
			// Created at of the checkpoint label
			.select((eb) =>
				eb
					.selectFrom("entity_label")
					.innerJoin("label", "label.id", "entity_label.label_id")
					.whereRef("entity_label.entity_id", "=", "commit.id")
					.where("entity_label.schema_key", "=", "lix_commit")
					.where("entity_label.file_id", "=", "lix")
					.where("label.name", "=", "checkpoint")
					.select("entity_label.lixcol_created_at")
					.as("checkpoint_created_at"),
			)
			// Aggregated diff counts
			.select((eb) => [
				eb.fn
					.sum<number>(
						sql`CASE 
                            WHEN change.plugin_key = ${sql.lit(mdPlugin.key)} 
                             AND change.schema_key != ${sql.lit(AstSchemas.DocumentSchema["x-lix-key"])} 
                             AND change.snapshot_content IS NOT NULL 
                        THEN 1 ELSE 0 END`,
					)
					.as("added"),
				eb.fn
					.sum<number>(
						sql`CASE 
                            WHEN change.plugin_key = ${sql.lit(mdPlugin.key)} 
                             AND change.schema_key != ${sql.lit(AstSchemas.DocumentSchema["x-lix-key"])} 
                             AND change.snapshot_content IS NULL 
                        THEN 1 ELSE 0 END`,
					)
					.as("removed"),
			])
			.orderBy("checkpoint_created_at", "desc")
			.$castTo<{
				id: string;
				commit_id: string;
				checkpoint_created_at: string | null;
				added: number | null;
				removed: number | null;
			}>()
	);
}

/**
 * Generic diff counter for a change set.
 *
 * - Counts only Markdown changes and excludes RootOrder schema.
 * - If `fileId` is provided, restricts to that file; otherwise counts across all files.
 * - Accepts a concrete changeSetId or a subquery that selects it.
 */
// Chainable base query for diffs within a change set.
// Applies default filters: Markdown plugin and excludes RootOrder schema.
// Callers can further chain .where(...), .select(...), etc.
export function selectDiffCount({
	lix,
	changeSetId,
}: {
	lix: Lix;
	changeSetId: string | any;
}) {
	return lix.db
		.selectFrom("change_set_element")
		.leftJoin("change", "change.id", "change_set_element.change_id")
		.where("change_set_element.change_set_id", "=", changeSetId)
		.where("change.plugin_key", "=", mdPlugin.key)
		.where("change.schema_key", "!=", AstSchemas.DocumentSchema["x-lix-key"])
		.select((eb) => [
			eb.fn.count<number>("change.id").as("total"),
			eb.fn
				.sum<number>(
					sql`CASE WHEN change.snapshot_content IS NOT NULL THEN 1 ELSE 0 END`,
				)
				.as("added"),
			eb.fn
				.sum<number>(
					sql`CASE WHEN change.snapshot_content IS NULL THEN 1 ELSE 0 END`,
				)
				.as("removed"),
		]);
}

/**
 * Computes diff counts for a specific checkpoint (change set).
 *
 * If `fileId` is not provided, the active file (key "flashtype_active_file_id") is used.
 * Counts include only Markdown plugin changes and exclude RootOrder schema.
 */
export function selectCheckpointDiffCounts({
	lix,
	changeSetId,
	fileId,
}: {
	lix: Lix;
	changeSetId: string;
	fileId?: string | null;
}) {
	const fileIdQ = fileId
		? sql.lit(fileId)
		: lix.db
				.selectFrom("key_value")
				.where("key", "=", "flashtype_active_file_id")
				.select("value");

	return selectDiffCount({ lix, changeSetId })
		.where("change_set_element.file_id", "=", fileIdQ)
		.$castTo<{
			total: number | null;
			added: number | null;
			removed: number | null;
		}>();
}
