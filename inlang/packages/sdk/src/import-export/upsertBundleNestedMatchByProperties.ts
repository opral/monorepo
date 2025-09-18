import type { InlangProject } from "../project/api.js";
import { uuidV7 } from "@lix-js/sdk";
import type { NewBundleNested } from "../database/schema.js";

const isUniqueConstraintError = (error: unknown): boolean => {
	const resultCode = (error as any)?.resultCode;
	return resultCode === 1555 || resultCode === 2067;
};

export const upsertBundleNestedMatchByProperties = async (
	context: Pick<InlangProject, "db" | "lix">,
	bundle: NewBundleNested
): Promise<void> => {
	if (bundle.id === undefined) {
		throw new Error("upsert expets a bundle id for matching");
	}
	const bundleId = bundle.id;
	const bundleToInsert = {
		id: bundleId,
		declarations: bundle.declarations ?? [],
	};
	const bundleUpdate = {
		declarations: bundle.declarations ?? [],
	};

	const db = context.db;
	const generateUuid = () => uuidV7({ lix: context.lix });

	await db.transaction().execute(async (trx) => {
		try {
			await trx.insertInto("bundle").values(bundleToInsert).execute();
		} catch (error) {
			if (isUniqueConstraintError(error)) {
				await trx
					.updateTable("bundle")
					.set(bundleUpdate)
					.where("id", "=", bundleId)
					.execute();
			} else {
				throw error;
			}
		}

		const existingMessages = await trx
			.selectFrom("message")
			.where("bundleId", "=", bundleId)
			.selectAll()
			.execute();

		for (const message of bundle.messages) {
			// match by locale
			const existingMessage = existingMessages.find(
				(m) => m.locale === message.locale
			);

			const messageId =
				existingMessage?.id ?? message.id ?? (await generateUuid());
			const messageToInsert = {
				id: messageId,
				bundleId,
				locale: message.locale,
				selectors: message.selectors ?? [],
			};
			const messageUpdate = {
				bundleId,
				locale: message.locale,
				selectors: message.selectors ?? [],
			};
			try {
				await trx.insertInto("message").values(messageToInsert).execute();
			} catch (error) {
				if (isUniqueConstraintError(error)) {
					await trx
						.updateTable("message")
						.set(messageUpdate)
						.where("id", "=", messageId)
						.execute();
				} else {
					throw error;
				}
			}
			if (existingMessage === undefined) {
				existingMessages.push({
					id: messageId,
					bundleId,
					locale: message.locale,
					selectors: message.selectors ?? [],
				});
			}

			const existingVariants = await trx
				.selectFrom("variant")
				.where("messageId", "=", messageId)
				.selectAll()
				.execute();

			for (const variant of message.variants) {
				// match by matches
				const existingVariant = existingVariants.find(
					(v) => JSON.stringify(v.matches) === JSON.stringify(variant.matches)
				);

				const variantId =
					existingVariant?.id ?? variant.id ?? (await generateUuid());
				const variantToInsert = {
					id: variantId,
					messageId,
					matches: variant.matches ?? [],
					pattern: variant.pattern ?? [],
				};
				const variantUpdate = {
					messageId,
					matches: variant.matches ?? [],
					pattern: variant.pattern ?? [],
				};
				try {
					await trx.insertInto("variant").values(variantToInsert).execute();
				} catch (error) {
					if (isUniqueConstraintError(error)) {
						await trx
							.updateTable("variant")
							.set(variantUpdate)
							.where("id", "=", variantId)
							.execute();
					} else {
						throw error;
					}
				}
				if (existingVariant === undefined) {
					existingVariants.push({
						id: variantId,
						messageId,
						matches: variant.matches ?? [],
						pattern: variant.pattern ?? [],
					});
				}
			}
		}
	});
};
