import type { Lix } from "../lix/index.js";
import { applyOwnChanges } from "../own-change-control/apply-own-change.js";
import type { ChangeSet } from "./database-schema.js";
import type { LixDatabaseSchema } from "../database/schema.js";
import { sql, type ExpressionWrapper, type SqlBool } from "kysely";

/**
 * The modes for applying change sets.
 *
 * Is an object for future extensibility like
 * `{ type: "recursive", depth: number }`.
 */
type ApplyChangeSetMode = { type: "direct" } | { type: "recursive" };

/**
 * Filter to select changes that are associated with a specified change set.
 * In 'direct' mode, it only selects changes directly associated with the specified change set.
 * In 'recursive' mode, it selects leaf changes from the entire ancestry of the specified change set,
 * where a "leaf" change is the latest change for a given entity within the ancestry graph.
 *
 * @example
 *   ```ts
 *   await lix.db.selectFrom("change")
 *      .innerJoin("change_set_element", "change_set_element.change_id", "change.id")
 *      .where(changeIsLeafOfChangeSet(someChangeSet, { type: "recursive" }))
 *      .selectAll()
 *      .execute();
 *   ```
 */
export function changeIsLeafOfChangeSet(
	changeSet: Pick<ChangeSet, "id">,
	options?: { depth?: number } // depth === 0 is 'direct'
): ExpressionWrapper<LixDatabaseSchema, "change", SqlBool> {
	const maxDepth = options?.depth;
	return sql`
    EXISTS (
      WITH RECURSIVE change_set_ancestors(ancestor_id, depth) AS (
        -- Start with the specified change set
        SELECT id AS ancestor_id, 0 AS depth
        FROM change_set
        WHERE id = ${changeSet.id}

        UNION ALL

        -- Traverse parents, but limit depth if specified
        SELECT 
          change_set_edge.parent_id, 
          change_set_ancestors.depth + 1
        FROM change_set_edge
        INNER JOIN change_set_ancestors 
          ON change_set_edge.child_id = change_set_ancestors.ancestor_id
        ${maxDepth !== undefined ? sql`WHERE change_set_ancestors.depth < ${maxDepth}` : sql``}
      ),
      ancestor_changes AS (
        SELECT 
          c.id, 
          c.entity_id, 
          c.file_id,
          c.created_at
        FROM change c
        INNER JOIN change_set_element cse ON c.id = cse.change_id
        WHERE cse.change_set_id IN (
          SELECT ancestor_id FROM change_set_ancestors
        )
      ),
      latest_changes AS (
        SELECT id
        FROM (
          SELECT 
            id,
            entity_id,
            file_id,
            ROW_NUMBER() OVER (
              PARTITION BY entity_id, file_id 
              ORDER BY created_at DESC
            ) AS rn
          FROM ancestor_changes
        ) ranked
        WHERE rn = 1
      )
      SELECT 1
      FROM latest_changes
      WHERE latest_changes.id = change.id
    )
  ` as unknown as ExpressionWrapper<LixDatabaseSchema, "change", SqlBool>;
}

/**
 * Applies a change set to the lix.
 */
export async function applyChangeSet(args: {
	lix: Lix;
	changeSet: Pick<ChangeSet, "id">;
	/**
	 * The mode for applying the change set.
	 *
	 * @default "recursive"
	 */
	mode?: ApplyChangeSetMode;
}): Promise<void> {
	const mode = args.mode ?? { type: "recursive" };

	const executeInTransaction = async (trx: Lix["db"]) => {
		// Select changes associated with leaf change sets in the ancestry of the specified change set
		const changesResult = await trx
			.selectFrom("change")
			.innerJoin(
				"change_set_element",
				"change_set_element.change_id",
				"change.id"
			)
			.where(
				changeIsLeafOfChangeSet(args.changeSet, {
					depth: mode.type === "direct" ? 0 : undefined,
				})
			)
			.selectAll("change")
			.execute();

		// Group changes by file_id for processing
		const changesGroupedByFile = Object.groupBy(
			changesResult,
			(c) => c.file_id
		);

		// Plugin changes depend on lix changes like the file
		// data for example. Therefore, the lix changes need
		// to be applied first.
		const lixOwnChanges = changesGroupedByFile["lix_own_change_control"] ?? [];

		await applyOwnChanges({
			lix: { ...args.lix, db: trx },
			changes: lixOwnChanges,
		});

		const plugins = await args.lix.plugin.getAll();

		// Iterate over files and apply plugin changes
		for (const [file_id, changes] of Object.entries(changesGroupedByFile)) {
			const file = await trx
				.selectFrom("file")
				.where("id", "=", file_id)
				.selectAll()
				.executeTakeFirst();

			// lix own change control deleted the file
			// no plugin needs to apply changes
			if (file === undefined) {
				continue;
			} else if (file.data.byteLength === 0) {
				// @ts-expect-error - the plugin will handle undefined file.data
				delete file.data;
			}

			const groupByPlugin = Object.groupBy(changes ?? [], (c) => c.plugin_key);

			for (const [pluginKey, changes] of Object.entries(groupByPlugin)) {
				if (changes === undefined) {
					continue;
				}
				const plugin = plugins.find((plugin) => plugin.key === pluginKey);
				if (!plugin) {
					throw new Error(`Plugin with key ${pluginKey} not found`);
				} else if (!plugin.applyChanges) {
					throw new Error(
						`Plugin with key ${pluginKey} does not support applying changes`
					);
				}
				const { fileData } = await plugin.applyChanges({
					lix: { ...args.lix, db: trx },
					file,
					changes,
				});

				await trx
					.updateTable("file")
					.set({ data: fileData })
					.where("id", "=", file_id)
					.execute();
			}
		}
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
