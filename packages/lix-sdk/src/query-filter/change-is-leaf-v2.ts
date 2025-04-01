import { sql, type ExpressionWrapper, type SqlBool } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import type { GraphTraversalMode } from "../database/graph-traversal-mode.js";

/**
 * Filter to select "leaf" changes within a specific change set or its ancestry.
 *
 * A change is considered a "leaf" if it's the latest change for a given entity/file/schema
 * combination within the specified change set or its ancestry (depending on the mode).
 *
 * @example
 * ```ts
 * const changes = await db
 *   .selectFrom("change")
 *   .innerJoin("change_set_element", "change_set_element.change_id", "change.id")
 *   .where(changeIsLeafV2("some_change_set_id"))
 *   .selectAll("change")
 *   .execute();
 * ```
 *
 * @param change_set_id - The ID of the change set to filter changes for.
 * @param options - Optional configuration options.
 * @param options.mode - {@link GraphTraversalMode}
 */
export function changeIsLeafV2(
	change_set_id: string,
	options?: {
		mode?: GraphTraversalMode;
	}
): ExpressionWrapper<
	LixDatabaseSchema,
	"change" | "change_set_element",
	SqlBool
> {
	// Determine if we should include ancestors based on the mode
	const mode = options?.mode ?? { type: "recursive" };
	const includeAncestors = mode.type === "recursive";

	return sql<SqlBool>`
    -- Filter for changes in the specified change set or its ancestry
    (
      ${sql.ref("change_set_element.change_set_id")} = ${sql.lit(change_set_id)}
      ${
				includeAncestors
					? sql`OR EXISTS (
            SELECT 1 FROM change_set_edge cse_anc_check
            WHERE cse_anc_check.child_id = ${sql.lit(change_set_id)}
            AND cse_anc_check.parent_id = ${sql.ref("change_set_element.change_set_id")}
          )`
					: sql``
			}
    )
    
    -- Ensure this is the latest change for this entity/file/schema combination
    -- within the target change set's ancestry
    AND NOT EXISTS (
      SELECT 1
      FROM change child_change
      INNER JOIN change_set_element child_cse ON child_cse.change_id = child_change.id
      WHERE
        -- Match the same entity/file/schema
        child_change.schema_key = ${sql.ref("change.schema_key")}
        AND child_change.entity_id = ${sql.ref("change.entity_id")}
        AND child_change.file_id = ${sql.ref("change.file_id")}
        
        -- Only consider changes in the target change set's ancestry
        AND (
          child_cse.change_set_id = ${sql.lit(change_set_id)}
          ${
						includeAncestors
							? sql`OR EXISTS (
                SELECT 1 FROM change_set_edge cse_anc_check
                WHERE cse_anc_check.child_id = ${sql.lit(change_set_id)}
                AND cse_anc_check.parent_id = child_cse.change_set_id
              )`
							: sql``
					}
        )
        
        -- CRITICAL: Ensure the child change's change set is in the ancestry path
        -- between the current change's change set and the target change set
        AND (
          -- Either it's in the same change set (newer change in same set)
          (child_cse.change_set_id = ${sql.ref("change_set_element.change_set_id")} AND child_change.created_at > ${sql.ref("change.created_at")})
          
          -- OR it's in a descendant change set that's still an ancestor of the target
          OR (
            -- Child's change set is a descendant of current change's change set
            EXISTS (
              SELECT 1 FROM change_set_edge desc_check
              WHERE desc_check.parent_id = ${sql.ref("change_set_element.change_set_id")}
              AND desc_check.child_id = child_cse.change_set_id
            )
            -- AND child's change set is an ancestor of (or equal to) the target change set
            AND (
              child_cse.change_set_id = ${sql.lit(change_set_id)}
              OR EXISTS (
                SELECT 1 FROM change_set_edge anc_check
                WHERE anc_check.parent_id = child_cse.change_set_id
                AND anc_check.child_id = ${sql.lit(change_set_id)}
              )
            )
          )
        )
    )
  ` as unknown as ExpressionWrapper<
		LixDatabaseSchema,
		"change" | "change_set_element",
		SqlBool
	>;
}
