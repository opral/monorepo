import {
	sql,
	type ExpressionBuilder,
	type ExpressionWrapper,
	type SqlBool,
} from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import type { ChangeSet } from "../change-set/database-schema.js";
import type { GraphTraversalMode } from "../database/graph-traversal-mode.js";

/**
 * Filter to select leaf changes based on `change_set_edge` traversal.
 *
 * A "leaf" change is a change that belongs to a change set which is not overridden
 * by any descendant change set for the same entity/file/schema.
 *
 * ⚠️ This requires the calling query to join:
 * `.innerJoin("change_set_element", "change_set_element.change_id", "change.id")`
 * `.innerJoin("change_set", "change_set.id", "change_set_element.change_set_id")`
 *
 * @param changeSet The root change set to begin traversal
 * @param mode The graph traversal mode (default: full recursive)
 */
export function changeIsLeafV2(
	changeSet: Pick<ChangeSet, "id">,
	mode?: GraphTraversalMode
): (
	eb: ExpressionBuilder<LixDatabaseSchema, "change_set">
) => ExpressionWrapper<LixDatabaseSchema, "change_set", SqlBool> {
	const traversal = mode ?? { type: "recursive" };

	if (traversal.type === "direct") {
		return (eb) => eb("change_set.id", "=", changeSet.id);
	}

	const depthCondition =
		traversal.depth !== undefined
			? sql`WHERE ap.depth < ${sql.lit(traversal.depth)}`
			: sql``;

	return () =>
		sql`
    NOT EXISTS (
      SELECT 1
      FROM change newer
      JOIN change_set_element newer_cse ON newer.id = newer_cse.change_id
      JOIN change_set_edge edge ON edge.parent_id = change_set.id
      WHERE
        edge.child_id = newer_cse.change_set_id
        AND newer.entity_id = change.entity_id
        AND newer.file_id = change.file_id
        AND newer.schema_key = change.schema_key
        AND newer.id != change.id
        AND newer_cse.change_set_id IN (
          WITH RECURSIVE ancestor_path(id, depth) AS (
            SELECT id, 0 AS depth FROM change_set WHERE id = ${sql.lit(changeSet.id)}
            UNION ALL
            SELECT edge.parent_id, ap.depth + 1
            FROM change_set_edge edge
            JOIN ancestor_path ap ON edge.child_id = ap.id
            ${depthCondition}
          )
          SELECT id FROM ancestor_path
        )
    )
  ` as unknown as ExpressionWrapper<LixDatabaseSchema, "change_set", SqlBool>;
}

/**
 * Filters changes that are "leaf" changes in the selected change sets.
 *
 * A **leaf change** is one for which no **descendant change set**
 * (via `change_set_edge`) contains a newer change that redefines the same
 * `(entity_id, file_id, schema_key)`.
 *
 * This filter allows you to identify the most recent changes to entities
 * across any connected group of change sets, based on their graph relationships.
 *
 * ---
 *
 * ✅ This filter is flexible and can be used with any set of change sets:
 * - A single change set
 * - A sequence of connected change sets
 * - A graph of change sets with multiple concurrent end points
 *
 * ---
 *
 * ⚠️ This filter only filters which changes are leaves — it does **not**:
 * - Deduplicate changes that affect the same entity
 * - Resolve which version is preferred when multiple leaf changes exist
 * - Define which change sets to include — that must be handled by the query
 *
 * ---
 *
 * ℹ️ Requirements:
 * - The outer query must join `change_set_element` to resolve the `change → change_set_id` mapping
 * - You are responsible for defining the scope of change sets using `.where(...)` or graph filters
 *
 * ---
 * @example Get leaf changes from a list of change sets
 * ```ts
 * db.selectFrom("change")
 *   .innerJoin("change_set_element", "change_set_element.change_id", "change.id")
 *   .where("change_set_element.change_set_id", "in", [cs0.id, cs1.id, cs2.id])
 *   .where(changeIsLeaf())
 *   .selectAll()
 * ```
 *
 * @example Get leaf changes from a recursive graph traversal
 * ```ts
 * db.selectFrom("change")
 *   .innerJoin("change_set_element", "change_set_element.change_id", "change.id")
 *   .where(changeSetIsAncestorOf(someChangeSet))
 *   .where(changeIsLeaf())
 *   .selectAll()
 * ```
 */
export function changeIsLeafV3(): (
	eb: ExpressionBuilder<LixDatabaseSchema, "change_set_element">
) => ExpressionWrapper<LixDatabaseSchema, "change_set_element", SqlBool> {
	return () =>
		sql<SqlBool>`
      NOT EXISTS (
        SELECT 1
        FROM change AS newer
        INNER JOIN change_set_element AS newer_cse
          ON newer_cse.change_id = newer.id
        INNER JOIN change_set_edge
          ON change_set_edge.child_id = newer_cse.change_set_id
        WHERE
          newer.entity_id = change.entity_id
          AND newer.file_id = change.file_id
          AND newer.schema_key = change.schema_key
          AND newer.id != change.id
          AND change_set_edge.parent_id = change_set_element.change_set_id
      )
    ` as unknown as ExpressionWrapper<LixDatabaseSchema, "change", SqlBool>;
}
