import type { SelectQueryBuilder } from "kysely";
import type { Lix } from "../lix/open-lix.js";
import type { DiffRow } from "../version/select-version-diff.js";
import { sql } from "kysely";

// Note: snapshots are not projected here; join `change` by id if needed.

/**
 * Returns the diff between the working state and the last checkpoint.
 *
 * The working state contains all changes made since the last checkpoint. This function
 * compares these changes against the checkpoint to show what has been created, updated,
 * or deleted. Optimized for real-time UI updates during active editing.
 *
 * Unlike {@link selectVersionDiff} which compares two complete versions, this operates
 * directly on change sets for better performance.
 *
 * ## Diff Status Meanings
 *
 * | Status      | Description                                  | Before | After  |
 * |-------------|----------------------------------------------|--------|--------|
 * | `created`   | Entity added since checkpoint                | null   | exists |
 * | `updated`   | Entity modified since checkpoint             | exists | exists |
 * | `deleted`   | Entity removed since checkpoint (tombstone)  | exists | null   |
 * | `unchanged` | Entity not modified in working state         | same   | same   |
 *
 * ## Performance
 *
 * - Queries only two change sets (working + latest checkpoint)
 * - No graph traversal or recursion
 * - Returns same shape as `selectVersionDiff` for compatibility
 *
 * @example
 * // Get all changes since the last checkpoint
 * const changes = await selectWorkingDiff({ lix })
 *   .where('status', '!=', 'unchanged')
 *   .execute();
 *
 * console.log(`${changes.length} changes since checkpoint`);
 *
 * @example
 * // Monitor changes to a specific file
 * const fileChanges = await selectWorkingDiff({ lix })
 *   .where('file_id', '=', 'config.json')
 *   .where('status', '!=', 'unchanged')
 *   .orderBy('entity_id')
 *   .execute();
 *
 * @example
 * // Check if specific entities have changed since checkpoint
 * const entityIds = ['user-1', 'user-2', 'user-3'];
 * const entityChanges = await selectWorkingDiff({ lix })
 *   .where('entity_id', 'in', entityIds)
 *   .where('status', '!=', 'unchanged')
 *   .execute();
 *
 * @example
 * // Count changes by status
 * const allChanges = await selectWorkingDiff({ lix })
 *   .where('status', '!=', 'unchanged')
 *   .execute();
 *
 * const stats = allChanges.reduce((acc, change) => {
 *   acc[change.status] = (acc[change.status] || 0) + 1;
 *   return acc;
 * }, {} as Record<string, number>);
 *
 * console.log('Changes:', stats);
 * // Output: { created: 5, updated: 3, deleted: 1 }
 *
 * @param args - Configuration object
 * @param args.lix - Lix instance with database connection
 *
 * @returns A Kysely query builder for `DiffRow` results that can be further filtered,
 * sorted, or executed.
 *
 * @see createCheckpoint - Convert working state into a checkpoint
 * @see selectVersionDiff - Compare two complete version states
 *
 * @example
 * // Fetch before/after snapshots by joining the `change` table
 * // Tip: apply filters (file_id, schema_key, status) before joining to keep it fast.
 * const rows = await selectWorkingDiff({ lix })
 *   .where('file_id', '=', 'lix')
 *   .where('schema_key', '=', 'lix_key_value')
 *   .where('status', '!=', 'unchanged')
 *   .leftJoin('change as before', 'before.id', 'before_change_id')
 *   .leftJoin('change as after', 'after.id', 'after_change_id')
 *   .select([
 *     'entity_id',
 *     'schema_key',
 *     'file_id',
 *     'status',
 *     'before.snapshot_content',
 *     'after.snapshot_content',
 *   ])
 *   .execute();
 *
 * // rows[i].before_snapshot_content / after_snapshot_content are JSON objects (or null)
 */
type DiffDB = { diff: DiffRow };

export function selectWorkingDiff(args: {
	lix: Lix;
}): SelectQueryBuilder<DiffDB, "diff", DiffRow> {
	const db = args.lix.db;

	// Active version details
	const workingCommitIdQ = db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.select((eb) => eb.ref("version.working_commit_id").as("id"));

	// Optimize: previous checkpoint is the parent of the current working commit
	const latestCheckpointCommitIdQ = db
		.selectFrom("commit_edge as ce")
		.innerJoin("commit as p", "p.id", "ce.parent_id")
		.innerJoin("entity_label as el", (join) =>
			join
				.onRef("el.entity_id", "=", "p.id")
				.on("el.schema_key", "=", "lix_commit")
		)
		.innerJoin("label as l", "l.id", "el.label_id")
		.whereRef("ce.child_id", "=", workingCommitIdQ)
		.where("l.name", "=", "checkpoint")
		.select("p.id")
		.limit(1);

	// Base SELECT: rows from the working change set
	const base = db
		.selectFrom("change as ch")
		.innerJoin("change_set_element as cse", "cse.change_id", "ch.id")
		.where(
			"cse.change_set_id",
			"=",
			sql`(select change_set_id from wcs)` as any
		)
		.where("ch.file_id", "!=", "lix_own_change_control")
		.leftJoin("change_set_element as bcse", (join) =>
			join
				.onRef("bcse.entity_id", "=", "ch.entity_id")
				.onRef("bcse.schema_key", "=", "ch.schema_key")
				.onRef("bcse.file_id", "=", "ch.file_id")
				.on("bcse.change_set_id", "=", sql`(select change_set_id from ccs)`)
		)
		// no join to `change bc` here — project ids only
		.select((eb) => [
			eb.ref("ch.entity_id").as("entity_id"),
			eb.ref("ch.schema_key").as("schema_key"),
			eb.ref("ch.file_id").as("file_id"),

			sql`NULL`.as("before_version_id"),
			eb.ref("bcse.change_id").as("before_change_id"),
			sql`(select id from cc)`.as("before_commit_id"),

			sql`NULL`.as("after_version_id"),
			eb.ref("ch.id").as("after_change_id"),
			sql`(select id from wc)`.as("after_commit_id"),

			sql<"created" | "updated" | "deleted" | "unchanged">`CASE
        WHEN bcse.change_id IS NOT NULL AND json(ch.snapshot_content) IS NULL THEN 'deleted'
        WHEN bcse.change_id IS NULL AND json(ch.snapshot_content) IS NOT NULL THEN 'created'
        WHEN bcse.change_id IS NOT NULL AND json(ch.snapshot_content) IS NOT NULL AND bcse.change_id != ch.id THEN 'updated'
        ELSE 'unchanged'
      END`.as("status"),
		]);

	// Unchanged rows = non-inherited, tracked state rows without a working CSE entry
	const unchanged = db
		.selectFrom("state_all as sa")
		.whereRef(
			"sa.version_id",
			"=",
			db.selectFrom("active_version").select("active_version.version_id")
		)
		.where("sa.inherited_from_version_id", "is", null)
		.where("sa.untracked", "=", false)
		// Anti-join to ensure no working edit exists for this triple
		.leftJoin("change_set_element as wcse", (join) =>
			join
				.onRef("wcse.entity_id", "=", "sa.entity_id")
				.onRef("wcse.schema_key", "=", "sa.schema_key")
				.onRef("wcse.file_id", "=", "sa.file_id")
				.on("wcse.change_set_id", "=", sql`(select change_set_id from wcs)`)
		)
		.where("wcse.change_id", "is", null)
		// For unchanged rows, before == after; reuse sa.* and avoid checkpoint joins
		.select((eb) => [
			eb.ref("sa.entity_id").as("entity_id"),
			eb.ref("sa.schema_key").as("schema_key"),
			eb.ref("sa.file_id").as("file_id"),
			sql`NULL`.as("before_version_id"),
			eb.ref("sa.change_id").as("before_change_id"),
			sql`(select id from cc)`.as("before_commit_id"),
			sql`NULL`.as("after_version_id"),
			eb.ref("sa.change_id").as("after_change_id"),
			sql`(select id from wc)`.as("after_commit_id"),
			sql<"unchanged">`'unchanged'`.as("status"),
		]);

	// CTEs for constants used across both UNION arms
	const union = sql<DiffRow>`(
        select * from (${base}) as w
        union all
        select * from (${unchanged}) as u
    )`.as("diff");

	return db
		.with("wc", () => workingCommitIdQ as any)
		.with("cc", () => latestCheckpointCommitIdQ as any)
		.with(
			"wcs",
			() =>
				db
					.selectFrom("commit")
					.where("id", "=", sql`(select id from wc)` as any)
					.select(["change_set_id"]) as any
		)
		.with(
			"ccs",
			() =>
				db
					.selectFrom("commit")
					.where("id", "=", sql`(select id from cc)` as any)
					.select(["change_set_id"]) as any
		)
		.selectFrom(union) as unknown as SelectQueryBuilder<
		DiffDB,
		"diff",
		DiffRow
	>;
}
