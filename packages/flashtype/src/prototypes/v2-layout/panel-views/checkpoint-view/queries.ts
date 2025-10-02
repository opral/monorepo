import type { Lix } from "@lix-js/sdk";
import { selectWorkingDiff } from "@lix-js/sdk";

export type WorkingDiffFileRow = {
	id: string;
	path: string;
};

/**
 * Lists files with working changes since the last checkpoint.
 *
 * Groups the current working diff by file id so UI layers can render a
 * deterministic checklist. The result excludes unchanged rows and comes sorted
 * alphabetically by file path for stable rendering.
 *
 * @example
 * const files = await selectWorkingDiffFiles(lix).execute();
 */
export function selectWorkingDiffFiles(lix: Lix) {
	return selectWorkingDiff({ lix })
		.where("diff.status", "!=", "unchanged")
		.innerJoin("file", "file.id", "diff.file_id")
		.groupBy(["file.id", "file.path"])
		.orderBy("file.path", "asc")
		.select((eb) => [
			eb.ref("file.id").as("id"),
			eb.ref("file.path").as("path"),
		])
		.$castTo<WorkingDiffFileRow>();
}
