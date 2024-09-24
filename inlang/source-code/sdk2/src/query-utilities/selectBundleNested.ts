import type { Kysely } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/sqlite";
import type { InlangDatabaseSchema } from "../database/schema.js";

/**
 * Select bundles with nested messages and variants.
 *
 * `{ bundle, messages: [{ message, variants: [{ variant }] }] }`
 *
 * @example
 *   // getting one bundle where id is 123
 *   await selectBundleNested(db)
 *     .where("bundle.id", "=", "123")
 *     .executeTakeFirst()
 *
 *   // getting all bundles
 *   await selectBundleNested(db)
 *     .execute()
 */
export const selectBundleNested = (db: Kysely<InlangDatabaseSchema>) => {
	return db.selectFrom("bundle").select((eb) => [
		// select all columns from bundle
		"id",
		"declarations",
		// select all columns from messages as "messages"
		jsonArrayFrom(
			eb
				.selectFrom("message")
				.select((eb) => [
					// select all columns from message
					"id",
					"bundleId",
					"locale",
					"selectors",
					// select all columns from variants as "variants"
					jsonArrayFrom(
						eb
							.selectFrom("variant")
							.select(["id", "messageId", "matches", "pattern"])
							.whereRef("variant.messageId", "=", "message.id")
					).as("variants"),
				])
				.whereRef("message.bundleId", "=", "bundle.id")
		).as("messages"),
	]);
};
