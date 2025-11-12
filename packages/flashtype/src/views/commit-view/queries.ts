import { plugin as mdPlugin } from "../../../../lix/plugin-md/dist";
import type { Lix } from "@lix-js/sdk";
import { sql } from "@lix-js/sdk";
import { AstSchemas } from "@opral/markdown-wc";

export type CheckpointFileChangeRow = {
	readonly file_id: string;
	readonly path: string;
	readonly added: number;
	readonly removed: number;
};

/**
 * Lists Markdown checkpoint changes grouped by file.
 *
 * Aggregates additions and removals for every file that participated in the
 * provided checkpoint. File paths are resolved from the live filesystem table
 * when available and fall back to historical descriptors or stable file ids.
 *
 * @example
 * const rows = await selectCheckpointFiles({
 *   lix,
 *   changeSetId: checkpointId,
 * }).execute();
 *
 * console.log(rows.map((row) => row.path));
 */
export function selectCheckpointFiles({
	lix,
	changeSetId,
}: {
	lix: Lix;
	changeSetId: string;
}) {
	const pathExpr = sql<string>`COALESCE(
		MAX(file.path),
		change_set_element.file_id
	)`;

	return lix.db
		.selectFrom("change_set_element")
		.innerJoin("change", "change.id", "change_set_element.change_id")
		.leftJoin("file", "file.id", "change_set_element.file_id")
		.where("change_set_element.change_set_id", "=", changeSetId)
		.where("change.plugin_key", "=", mdPlugin.key)
		.where("change.schema_key", "!=", AstSchemas.DocumentSchema["x-lix-key"])
		.groupBy(["change_set_element.file_id"])
		.select((eb) => [
			eb.ref("change_set_element.file_id").as("file_id"),
			pathExpr.as("path"),
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
		])
		.orderBy("path", "asc")
		.$castTo<CheckpointFileChangeRow>();
}
