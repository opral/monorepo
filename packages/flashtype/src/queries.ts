import { plugin as mdPlugin } from "@lix-js/plugin-md";
import type { Lix } from "@lix-js/sdk";
import { sql } from "@lix-js/sdk";

// Files
export function selectFiles(lix: Lix) {
	return lix.db
		.selectFrom("file")
		.select(["id", "path"]) // minimal row for explorer
		.orderBy("path", "asc");
}

// Working diff for the active file: total/added/removed in current working change set
export function selectWorkingDiffCount(lix: Lix) {
	const workingChangeSetIdQ = lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.innerJoin("commit", "version.working_commit_id", "commit.id")
		.select("commit.change_set_id");

	const activeFileIdQ = lix.db
		.selectFrom("key_value")
		.where("key", "=", "flashtype_active_file_id")
		.select("value");

	return lix.db
		.selectFrom("change_set_element")
		.innerJoin("change", "change_set_element.change_id", "change.id")
		.where("change_set_element.change_set_id", "=", workingChangeSetIdQ)
		.where("change.file_id", "=", activeFileIdQ)
		.where("change.plugin_key", "=", mdPlugin.key)
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
