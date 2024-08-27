import type { Kysely } from "kysely";
import { json } from "./toJSONRawBuilder.js";
import type {
	InlangDatabaseSchema,
	NewBundleNested,
} from "../database/schema.js";

export const insertBundleNested = async (
	db: Kysely<InlangDatabaseSchema>,
	bundle: NewBundleNested
): Promise<void> => {
	const insertedBundle = await db
		.insertInto("bundle")
		.values({
			id: bundle.id,
			alias: json(bundle.alias),
		})
		.returning("id")
		.executeTakeFirstOrThrow();

	for (const message of bundle.messages) {
		const insertedMessage = await db
			.insertInto("message")
			.values({
				id: message.id,
				bundleId: insertedBundle.id,
				locale: message.locale,
				declarations: json(message.declarations),
				selectors: json(message.selectors),
			})
			.returning("id")
			.executeTakeFirstOrThrow();

		for (const variant of message.variants) {
			await db
				.insertInto("variant")
				.values({
					id: variant.id,
					messageId: insertedMessage.id,
					match: json(variant.match),
					pattern: json(variant.pattern),
				})
				.execute();
		}
	}
};
