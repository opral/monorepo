import type { InlangProject } from "../project/api.js";
import { uuidV7 } from "@lix-js/sdk";
import { humanId } from "../human-id/human-id.js";
import type { NewBundleNested } from "../database/schema.js";

export const insertBundleNested = async (
	context: Pick<InlangProject, "db" | "lix">,
	bundle: NewBundleNested
): Promise<void> => {
	const db = context.db;
	const generateUuid = async () => uuidV7({ lix: context.lix });

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
			const messageId = message.id ?? (await generateUuid());
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
				const variantId = variant.id ?? (await generateUuid());
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
