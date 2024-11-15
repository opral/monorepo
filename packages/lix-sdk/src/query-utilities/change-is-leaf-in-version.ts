import { sql, type ExpressionWrapper, type SqlBool } from "kysely";
import type { Version, LixDatabaseSchema } from "../database/schema.js";

/**
 * Selects changes that are not a parent of any other change within the specified version.
 *
 * @example
 *   ```ts
 *   await lix.db.selectFrom("change")
 *     .where(changeIsLeafInVersion(currentVersion))
 *     .selectAll()
 *     .execute();
 *   ```
 */
export function changeIsLeafInVersion(version: Pick<Version, "change_set_id">) {
	return sql`
    change.id IN (
      WITH RECURSIVE version_changes(id) AS (
        SELECT change_id AS id
        FROM change_set_element
        WHERE change_set_id = ${version.change_set_id}
        UNION ALL
        SELECT change_edge.parent_id AS id
        FROM change_edge
        INNER JOIN version_changes ON version_changes.id = change_edge.child_id
      )
      SELECT id FROM version_changes
      WHERE id NOT IN (
        SELECT parent_id
        FROM change_edge
        WHERE child_id IN (SELECT id FROM version_changes)
      )
    )
  ` as unknown as ExpressionWrapper<LixDatabaseSchema, "change", SqlBool>;
}
