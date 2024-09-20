import type { Kysely } from "kysely";
import type {
	InlangDatabaseSchema,
	NewBundleNested,
} from "../database/schema.js";

export const upsertBundleNested = async (
	db: Kysely<InlangDatabaseSchema>,
	bundle: NewBundleNested
): Promise<void> => {
	await db.transaction().execute(async (trx) => {
		const insertedBundle = await trx
			.insertInto("bundle")
			.values({
				id: bundle.id,
			})
			.returning("id")
			.onConflict((oc) =>
				oc.column("id").doUpdateSet({
					...bundle,
					// @ts-expect-error
					messages: undefined,
				})
			)
			.executeTakeFirstOrThrow();

		for (const message of bundle.messages) {
			const insertedMessage = await trx
				.insertInto("message")
				.values({
					id: message.id,
					bundleId: insertedBundle.id,
					declarations: message.declarations,
					locale: message.locale,
					selectors: message.selectors,
				})
				.onConflict((oc) =>
					oc.column("id").doUpdateSet({
						...message,
						// @ts-expect-error
						variants: undefined,
					})
				)
				.returning("id")
				.executeTakeFirstOrThrow();

			for (const variant of message.variants) {
				await trx
					.insertInto("variant")
					.values({
						id: variant.id,
						messageId: insertedMessage.id,
						match: variant.match,
						pattern: variant.pattern,
					})
					.onConflict((oc) => oc.column("id").doUpdateSet(variant))
					.execute();
			}
		}
	});
};
