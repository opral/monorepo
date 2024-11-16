import { sql, ExpressionWrapper, type SqlBool } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import type { Change } from "../database/schema.js";

/**
 * Filter to select the last descendant of the specified change.
 *
 * @example
 *   Checking for the leaf of a change in all versiones.
 *
 *   ```ts
 *   await lix.db.selectFrom("change")
 *      .where(changeIsLeafOf(someChange))
 *      .selectAll()
 *      .execute();
 *   ```
 *
 * @example
 *   Checking for the leaf of a change in a specific version.
 *
 *   ```ts
 *   await lix.db.selectFrom("change")
 *     .where(changeIsLeafOf(someChange))
 *     .where(changeInVersion(someVersion))
 *     .selectAll()
 *     .execute();
 *   ```
 */
export function changeIsLeafOf(change: Pick<Change, "id">) {
	return sql`
    change.id IN (
      WITH RECURSIVE descendants(id) AS (
        SELECT id
        FROM change
        WHERE id = ${change.id}
        UNION ALL
        SELECT change.id
        FROM change
        INNER JOIN change_edge ON change_edge.child_id = change.id
        INNER JOIN descendants ON change_edge.parent_id = descendants.id
      )
      SELECT id FROM descendants
      WHERE id NOT IN (SELECT parent_id FROM change_edge)
    )
  ` as unknown as ExpressionWrapper<LixDatabaseSchema, "change", SqlBool>;
}
