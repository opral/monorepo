import { sql, type ExpressionWrapper, type SqlBool } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";

/**
 * Filter to select "leaf" changes — the latest change per (entity_id, file_id, schema_key).
 *
 * A change is considered a leaf if:
 * - It belongs to a change set
 * - No descendant change set contains a newer change for the same entity, file, and schema
 *
 * ---
 *
 * @example
 * Querying multiple change sets and filtering for leaf changes:
 *
 * ```ts
 * const leafChanges = await db
 *   .selectFrom("change")
 *   .innerJoin("change_set_element", "change_set_element.change_id", "change.id")
 *   .where((eb) =>
 *     eb.or([
 *       eb("change_set_element.change_set_id", "=", changeSet0.id),
 *       eb("change_set_element.change_set_id", "=", changeSet1.id),
 *       eb("change_set_element.change_set_id", "=", changeSet2.id),
 *     ])
 *   )
 *   .where(changeIsLeafV2())
 *   .selectAll("change")
 *   .execute();
 * ```
 *
 * @example
 * Mixing and matching with other filters.
 *
 * ```ts
 * const leafChanges = await db
 *   .selectFrom("change")
 *   .innerJoin("change_set_element", "change_set_element.change_id", "change.id")
 *   .where(changeSetIsAncestorOf(someChangeSet))
 *   .where(changeIsLeafV2())
 *   .selectAll("change")
 *   .execute();
 * ```
 *
 * @returns A SQL expression to filter out non-leaf changes based on change_set_edge ancestry.
 */

export function changeIsLeafV2(): ExpressionWrapper<
	LixDatabaseSchema,
	"change",
	SqlBool
> {
	return sql`
    NOT EXISTS (
      SELECT 1
      FROM change_set_element cse_outer
      INNER JOIN change_set_edge cse_edge ON cse_edge.parent_id = change_set_element.change_set_id
      INNER JOIN change_set_element cse_child ON cse_child.change_set_id = cse_edge.child_id
      INNER JOIN change c_child ON c_child.id = cse_child.change_id
      WHERE 
        c_child.entity_id = change.entity_id
        AND c_child.file_id = change.file_id
    )
  ` as unknown as ExpressionWrapper<LixDatabaseSchema, "change", SqlBool>;
}
