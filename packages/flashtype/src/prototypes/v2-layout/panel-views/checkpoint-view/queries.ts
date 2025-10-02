import type { Lix } from "@lix-js/sdk";
import { selectWorkingDiff, sql } from "@lix-js/sdk";

export type WorkingFileSummary = {
	id: string;
	path: string;
	status: "added" | "modified" | "removed";
};

/**
 * Lists files with working changes since the last checkpoint, labelled with
 * derived status and stable display path.
 */
export function selectWorkingDiffFiles(lix: Lix) {
	return selectWorkingDiff({ lix })
		.where("diff.status", "!=", "unchanged")
		.where("diff.file_id", "!=", "lix")
		.leftJoin("file", "file.id", "diff.file_id")
		.leftJoin("change as before", "before.id", "diff.before_change_id")
		.leftJoin("change as after", "after.id", "diff.after_change_id")
		.where(() => sql`diff.schema_key != 'lix_directory_descriptor'`)
		.select((eb) => {
			const pathExpr = sql<string>`COALESCE(
				MAX(file.path),
				MAX(CASE
					WHEN diff.schema_key = 'lix_file_descriptor' AND json_extract(after.snapshot_content, '$.name') IS NOT NULL THEN
						'/' || json_extract(after.snapshot_content, '$.name') ||
						CASE
							WHEN json_extract(after.snapshot_content, '$.extension') IS NOT NULL AND json_extract(after.snapshot_content, '$.extension') != ''
								THEN '.' || json_extract(after.snapshot_content, '$.extension')
							ELSE ''
						END
					WHEN diff.schema_key = 'lix_file_descriptor' AND json_extract(before.snapshot_content, '$.name') IS NOT NULL THEN
						'/' || json_extract(before.snapshot_content, '$.name') ||
						CASE
							WHEN json_extract(before.snapshot_content, '$.extension') IS NOT NULL AND json_extract(before.snapshot_content, '$.extension') != ''
								THEN '.' || json_extract(before.snapshot_content, '$.extension')
							ELSE ''
						END
					ELSE NULL
				END),
				diff.file_id
			)`;

			const aggregatedStatus = sql<WorkingFileSummary["status"]>`CASE
				WHEN MAX(CASE WHEN diff.schema_key = 'lix_file_descriptor' AND diff.status = 'removed' THEN 1 ELSE 0 END) = 1 THEN 'removed'
				WHEN MAX(CASE WHEN diff.schema_key = 'lix_file_descriptor' AND diff.status = 'added' THEN 1 ELSE 0 END) = 1 THEN 'added'
				ELSE 'modified'
			END`;

			return [
				eb.ref("diff.file_id").as("id"),
				pathExpr.as("path"),
				aggregatedStatus.as("status"),
			];
		})
		.groupBy(["diff.file_id"])
		.orderBy("path", "asc")
		.$castTo<WorkingFileSummary>();
}
