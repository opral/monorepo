import { ExpressionWrapper, sql } from "kysely";
import type { Version, LixDatabaseSchema } from "../database/schema.js";
import type { SqlBool } from "kysely";

/**
 * Filters if a change is in the given Version.
 *
 * @deprecated Use `changeSetElementInAncestryOf` instead
 *
 * @example
 *   ```ts
 *   const changes = await lix.db.selectFrom("change")
 *      .where(changeInVersion(currentVersion))
 *      .selectAll()
 *      .execute();
 *   ```
 */
export function changeInVersion(version: Pick<Version, "id">) {
	return sql`
    change.id IN (
      WITH RECURSIVE recursive_changes(id) AS (
        SELECT change_id AS id
        FROM version_change
        WHERE version_id = ${version.id}
        UNION ALL
        SELECT change_edge.parent_id AS id
        FROM change_edge
        INNER JOIN recursive_changes ON recursive_changes.id = change_edge.child_id
      )
      SELECT id FROM recursive_changes
    )
  ` as unknown as ExpressionWrapper<LixDatabaseSchema, "change", SqlBool>;
}
