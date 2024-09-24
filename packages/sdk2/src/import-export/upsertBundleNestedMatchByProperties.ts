import type { Kysely } from "kysely";
import type {
	InlangDatabaseSchema,
	NewBundleNested,
	NewMessageNested,
} from "../database/schema.js";

export const upsertBundleNestedMatchByProperties = async (
	db: Kysely<InlangDatabaseSchema>,
	bundle: NewBundleNested
): Promise<void> => {
	if (bundle.id === undefined) {
		throw new Error("upsert expets a bundle id for matching");
	}
	const bundleToInsert = { ...bundle, messages: undefined };
	const insertedBundleResult = await db
		.insertInto("bundle")
		.values(bundleToInsert)
		.onConflict((oc) => oc.column("id").doUpdateSet(bundleToInsert))
		.executeTakeFirstOrThrow();


	const insertedBundleId = insertedBundleResult.insertId;

	if (insertedBundleId !== undefined) {
		const messagesOnBundle = await db
			.selectFrom("message")
			.selectAll()
			.where("bundleId", "=", bundle.id)
			.execute();

		for (const importedMessage of bundle.messages) {
			// try to find the messages by language and the variants by there matchers
			const exisitngMessage = messagesOnBundle.find(
				(existingMessage) => existingMessage.locale === importedMessage.locale
			);
			if (exisitngMessage) {
				const variantsOnMatchingMessage = await db
					.selectFrom("variant")
					.selectAll()
					.where("messageId", "=", exisitngMessage.id)
					.execute();
				for (const importedVariant of importedMessage.variants) {
					const existingVariant = variantsOnMatchingMessage.find(
						(existingVariant) =>
							JSON.stringify(existingVariant.matches) ===
							JSON.stringify(importedVariant.matches)
					);
					if (existingVariant) {
						// update existing variant
						await db
							.updateTable("variant")
							.set({
								...importedVariant,
								id: undefined,
							})
							.where("id", "=", existingVariant.id)
							.execute();
					} else {
						await db
							.insertInto("variant")
							.values({
								...importedVariant,
								messageId: exisitngMessage.id,
								id: undefined, // let the db create the id for us
							})
							.execute();
					}
				}
			} else {
				// message did not exist - no need to match just insert the messages/variants
				await insertMessageDeep(db, bundle, importedMessage);
			}
		}
	} else {
		// bundle did not exist - no need to match just insert the messages/variants

		for (const message of bundle.messages) {
			await insertMessageDeep(db, bundle, message);
		}
	}
};

/**
 * Helper mehtod that allows to insert a message deeply
 * @param db
 * @param bundle
 * @param message
 */
async function insertMessageDeep(
	db: Kysely<InlangDatabaseSchema>,
	bundle: NewBundleNested,
	message: NewMessageNested
) {
	const insertedMessage = await db
		.insertInto("message")
		.values({
			...message,
			id: undefined,
			bundleId: bundle.id!,
			// @ts-expect-error - the type has no variants
			variants: undefined,
		})
		.returning("id")
		.executeTakeFirstOrThrow();

	for (const variant of message.variants) {
		await db
			.insertInto("variant")
			.values({
				...variant,
				id: undefined, // let the db create the id here
				messageId: insertedMessage.id,
			})
			.execute();
	}
}
