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
							JSON.stringify(existingVariant.match) ===
							JSON.stringify(importedVariant.match)
					);
					if (existingVariant) {
						// make sure we don't have an id set on the import that could override the id in the db
						delete importedVariant.id;
						// update existing variant
						await db
							.updateTable("variant")
							.set({
								...importedVariant,
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
	const messageToInsert = {
		// don't provide an identifier since we match by locale in the future
		...message,
		id: undefined, // let the db create the id here
		variants: undefined,
		bundleId: bundle.id,
	};
	const insertedMessage = await db
		.insertInto("message")
		.values(messageToInsert)
		.returning("id")
		.executeTakeFirstOrThrow();

	for (const variant of message.variants) {
		delete variant.id;
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
