import type { Kysely } from "kysely";
import { v7 } from "uuid";
import { humanId } from "../human-id/human-id.js";
import type {
	InlangDatabaseSchema,
	NewBundleNested,
} from "../database/schema.js";

export const insertBundleNested = async (
	db: Kysely<InlangDatabaseSchema>,
	bundle: NewBundleNested
): Promise<void> => {
	await db.transaction().execute(async (trx) => {
		const bundleId = bundle.id ?? humanId();
		await trx
			.insertInto("bundle")
			.values({
				id: bundleId,
				declarations: bundle.declarations ?? [],
			})
			.execute();

		for (const message of bundle.messages) {
			const messageId = message.id ?? v7();
			await trx
				.insertInto("message")
				.values({
					id: messageId,
					bundleId,
					locale: message.locale,
					selectors: message.selectors ?? [],
				})
				.execute();

			for (const variant of message.variants) {
				const variantId = variant.id ?? v7();
				await trx
					.insertInto("variant")
					.values({
						id: variantId,
						messageId: messageId,
						matches: variant.matches ?? [],
						pattern: variant.pattern ?? [],
					})
					.execute();
			}
		}
	});
};
