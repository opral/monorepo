/* eslint-disable unicorn/no-null */
import { sql, type ExpressionBuilder } from "kysely";
import type { InlangDatabaseSchema } from "../database/schema.js";

/**
 * Find a bundle by id or alias.
 *
 * @example
 *   const bundle = await project.db
 *     .selectFrom("bundle")
 *     .where(bundleIdOrAliasIs("human_blue_moon"))
 *     .execute();
 *
 *   const bundle = await selectBundleNested()
 *     .where(bundleIdOrAliasIs("human_blue_moon"))
 *     .execute();
 */
export function bundleIdOrAliasIs(idOrAlias: string) {
	return (eb: ExpressionBuilder<InlangDatabaseSchema, "bundle">) =>
		eb.or([
			eb("bundle.id", "=", idOrAlias),
			eb(
				"bundle.id",
				"in",
				// @ts-expect-error - struggles with raw sql
				sql`(
					SELECT bundle.id
					FROM bundle, json_each(bundle.alias)
					WHERE json_each.value = ${idOrAlias}
				)`
			),
		]);
}
