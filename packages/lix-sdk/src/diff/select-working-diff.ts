import type { SelectQueryBuilder } from "kysely";
import type { Lix } from "../lix/open-lix.js";
import type { DiffRow } from "../version/select-version-diff.js";
import { sql } from "kysely";

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
 *   .where('diff.status', '!=', 'unchanged')
 *   .execute();
 *
 * console.log(`${changes.length} changes since checkpoint`);
 *
 * @example
 * // Monitor changes to a specific file
 * const fileChanges = await selectWorkingDiff({ lix })
 *   .where('diff.file_id', '=', 'config.json')
 *   .where('diff.status', '!=', 'unchanged')
 *   .orderBy('diff.entity_id')
 *   .execute();
 *
 * @example
 * // Check if specific entities have changed since checkpoint
 * const entityIds = ['user-1', 'user-2', 'user-3'];
 * const entityChanges = await selectWorkingDiff({ lix })
 *   .where('diff.entity_id', 'in', entityIds)
 *   .where('diff.status', '!=', 'unchanged')
 *   .execute();
 *
 * @example
 * // Count changes by status
 * const allChanges = await selectWorkingDiff({ lix })
 *   .where('diff.status', '!=', 'unchanged')
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
 */
export function selectWorkingDiff(args: { lix: Lix }): SelectQueryBuilder<any, "diff", DiffRow> {
	const db = args.lix.db;

	// Active version details
	const workingCommitIdQ = db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.select("version.working_commit_id");

	const workingChangeSetIdQ = db
		.selectFrom("commit")
		.where("id", "=", workingCommitIdQ)
		.select("change_set_id");

	const latestCheckpointChangeSetIdQ = db
		.selectFrom("commit")
		.innerJoin("entity_label", (join) =>
			join
				.onRef("entity_label.entity_id", "=", "commit.id")
				.on("entity_label.schema_key", "=", "lix_commit")
		)
		.innerJoin("label", "label.id", "entity_label.label_id")
		.where("label.name", "=", "checkpoint")
		.select("commit.change_set_id")
		.orderBy("commit.lixcol_updated_at", "desc")
		.limit(1);

	const latestCheckpointCommitIdQ = db
		.selectFrom("commit")
		.innerJoin("entity_label", (join) =>
			join
				.onRef("entity_label.entity_id", "=", "commit.id")
				.on("entity_label.schema_key", "=", "lix_commit")
		)
		.innerJoin("label", "label.id", "entity_label.label_id")
		.where("label.name", "=", "checkpoint")
		.select("commit.id")
		.orderBy("commit.lixcol_updated_at", "desc")
		.limit(1);

	// Base SELECT: rows from the working change set
	const base = db
		.selectFrom("change as ch")
		.innerJoin("change_set_element as cse", "cse.change_id", "ch.id")
		.where("cse.change_set_id", "=", workingChangeSetIdQ)
		.where("ch.file_id", "!=", "lix_own_change_control")
		.select((eb) => [
			eb.ref("ch.entity_id").as("entity_id"),
			eb.ref("ch.schema_key").as("schema_key"),
			eb.ref("ch.file_id").as("file_id"),

			sql`NULL`.as("before_version_id"),
			// Latest matching change in the latest checkpoint
			eb
				.selectFrom("change as bc")
				.innerJoin("change_set_element as bcse", "bcse.change_id", "bc.id")
				.where("bcse.change_set_id", "=", latestCheckpointChangeSetIdQ)
				.whereRef("bc.entity_id", "=", "ch.entity_id")
				.whereRef("bc.schema_key", "=", "ch.schema_key")
				.whereRef("bc.file_id", "=", "ch.file_id")
				.select("bc.id")
				.orderBy("bc.created_at", "desc")
				.limit(1)
				.as("before_change_id"),
			latestCheckpointCommitIdQ.as("before_commit_id"),

			sql`NULL`.as("after_version_id"),
			eb.ref("ch.id").as("after_change_id"),
			workingCommitIdQ.as("after_commit_id"),

			sql<"created" | "updated" | "deleted" | "unchanged">`CASE
        WHEN json(ch.snapshot_content) IS NULL AND EXISTS (
          SELECT 1 FROM change_set_element bcse
          JOIN "change" bc ON bc.id = bcse.change_id
          WHERE bcse.change_set_id = (${latestCheckpointChangeSetIdQ})
            AND bc.entity_id = ch.entity_id
            AND bc.schema_key = ch.schema_key
            AND bc.file_id = ch.file_id
          LIMIT 1
        ) THEN 'deleted'
        WHEN NOT EXISTS (
          SELECT 1 FROM change_set_element bcse
          JOIN "change" bc ON bc.id = bcse.change_id
          WHERE bcse.change_set_id = (${latestCheckpointChangeSetIdQ})
            AND bc.entity_id = ch.entity_id
            AND bc.schema_key = ch.schema_key
            AND bc.file_id = ch.file_id
          LIMIT 1
        ) THEN 'created'
        WHEN EXISTS (
          SELECT 1 FROM change_set_element bcse
          JOIN "change" bc ON bc.id = bcse.change_id
          WHERE bcse.change_set_id = (${latestCheckpointChangeSetIdQ})
            AND bc.entity_id = ch.entity_id
            AND bc.schema_key = ch.schema_key
            AND bc.file_id = ch.file_id
            AND bc.id != ch.id
          LIMIT 1
        ) THEN 'updated'
        ELSE 'unchanged'
      END`.as("status"),
		]);

	// Unchanged rows = non-inherited, tracked state rows not present in working CSE
	const unchanged = db
		.selectFrom("state_all as sa")
		.whereRef(
			"sa.version_id",
			"=",
			db.selectFrom("active_version").select("active_version.version_id")
		)
		.where("sa.inherited_from_version_id", "is", null)
		.where("sa.untracked", "=", false)
		.where((eb) =>
			eb.not(
				eb.exists(
					eb
						.selectFrom("change_set_element")
						.whereRef("change_set_element.entity_id", "=", "sa.entity_id")
						.whereRef("change_set_element.schema_key", "=", "sa.schema_key")
						.whereRef("change_set_element.file_id", "=", "sa.file_id")
						.where("change_set_element.change_set_id", "=", workingChangeSetIdQ)
          .select((eb2) => eb2.val(1).as('one'))
				)
			)
		)
		.select((eb) => [
			eb.ref("sa.entity_id").as("entity_id"),
			eb.ref("sa.schema_key").as("schema_key"),
			eb.ref("sa.file_id").as("file_id"),
			sql`NULL`.as("before_version_id"),
			// before_change_id (latest matching in latest checkpoint)
			eb
				.selectFrom("change as bc")
				.innerJoin("change_set_element as bcse", "bcse.change_id", "bc.id")
				.where("bcse.change_set_id", "=", latestCheckpointChangeSetIdQ)
				.whereRef("bc.entity_id", "=", "sa.entity_id")
				.whereRef("bc.schema_key", "=", "sa.schema_key")
				.whereRef("bc.file_id", "=", "sa.file_id")
				.select("bc.id")
				.orderBy("bc.created_at", "desc")
				.limit(1)
				.as("before_change_id"),
			latestCheckpointCommitIdQ.as("before_commit_id"),
			sql`NULL`.as("after_version_id"),
			eb.ref("sa.change_id").as("after_change_id"),
			workingCommitIdQ.as("after_commit_id"),
			sql<"unchanged">`'unchanged'`.as("status"),
		]);

	const union =
		sql`(select * from (${base}) as w union all select * from (${unchanged}) as u)`.as(
			"diff"
		);

	return db.selectFrom(union).selectAll() as unknown as SelectQueryBuilder<
		any,
		"diff",
		DiffRow
	>;
}
