import { sql, type ExpressionWrapper, type SqlBool } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import type { ChangeSet } from "../change-set/database-schema.js";

/**
 * Filter to select changes that are associated with a specified change set.
 * Can be used with different depth configurations:
 * - depth=0: Only selects changes directly in the specified change set.
 * - undefined depth (or depth>0): Selects leaf changes from the ancestry graph of the specified change set,
 *   where a "leaf" change is the latest change for a given entity within the ancestry graph.
 *
 * @example
 *   ```ts
 *   // Get only changes directly in this change set (depth=0)
 *   await lix.db.selectFrom("change")
 *      .innerJoin("change_set_element", "change_set_element.change_id", "change.id")
 *      .where(changeIsLeafOfChangeSet(someChangeSet, { depth: 0 }))
 *      .selectAll()
 *      .execute();
 *   ```
 * 
 * @example
 *   ```ts
 *   // Get all changes from this change set and its ancestry (unlimited depth)
 *   await lix.db.selectFrom("change")
 *      .innerJoin("change_set_element", "change_set_element.change_id", "change.id")
 *      .where(changeIsLeafOfChangeSet(someChangeSet))
 *      .selectAll()
 *      .execute();
 *   ```
 * 
 * @param changeSet The change set to examine
 * @param options Optional configuration: { depth?: number } where depth=0 means only changes directly in the specified change set
 */
export function changeIsLeafOfChangeSet(
	changeSet: Pick<ChangeSet, "id">,
	options?: { depth?: number }
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
