import type { Kysely } from "kysely";
import type { BundleNested } from "../schema/schemaV2.js";
import { json } from "./toJSONRawBuilder.js";
import type { InlangDatabaseSchema } from "../database/schema.js";

export const insertBundleNested = async (
	db: Kysely<InlangDatabaseSchema>,
	bundle: BundleNested
): Promise<void> => {
	await db
		.insertInto("bundle")
		.values({
			id: bundle.id,
			alias: json(bundle.alias),
		})
		.returning("id")
		.execute();

	for (const message of bundle.messages) {
		await db
			.insertInto("message")
			.values({
				id: message.id,
				bundleId: bundle.id,
				locale: message.locale,
				declarations: json(message.declarations),
				selectors: json(message.selectors),
			})
			.execute();

		for (const variant of message.variants) {
			await db
				.insertInto("variant")
				.values({
					id: variant.id,
					messageId: message.id,
					match: json(variant.match),
					pattern: json(variant.pattern),
				})
				.execute();
		}
	}
};
