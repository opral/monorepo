import type { Kysely } from "kysely";
import { v7 } from "uuid";
import { humanId } from "../human-id/human-id.js";
import type {
	InlangDatabaseSchema,
	NewBundleNested,
} from "../database/schema.js";

const isUniqueConstraintError = (error: unknown): boolean => {
	const resultCode = (error as any)?.resultCode;
	return resultCode === 1555 || resultCode === 2067;
};

export const upsertBundleNested = async (
	db: Kysely<InlangDatabaseSchema>,
	bundle: NewBundleNested
): Promise<void> => {
	await db.transaction().execute(async (trx) => {
		const bundleId = bundle.id ?? humanId();
		const bundleInsertValues = {
			id: bundleId,
			declarations: bundle.declarations ?? [],
		};
		const bundleUpdateValues = {
			declarations: bundleInsertValues.declarations,
		};
		try {
			await trx.insertInto("bundle").values(bundleInsertValues).execute();
		} catch (error) {
			if (isUniqueConstraintError(error)) {
				await trx
					.updateTable("bundle")
					.set(bundleUpdateValues)
					.where("id", "=", bundleId)
					.execute();
			} else {
				throw error;
			}
		}

		for (const message of bundle.messages) {
			const messageId = message.id ?? v7();
			const messageInsertValues = {
				id: messageId,
				bundleId,
				locale: message.locale,
				selectors: message.selectors ?? [],
			};
			const messageUpdateValues = {
				bundleId,
				locale: message.locale,
				selectors: message.selectors ?? [],
			};
			try {
				await trx.insertInto("message").values(messageInsertValues).execute();
			} catch (error) {
				if (isUniqueConstraintError(error)) {
					await trx
						.updateTable("message")
						.set(messageUpdateValues)
						.where("id", "=", messageId)
						.execute();
				} else {
					throw error;
				}
			}

			for (const variant of message.variants) {
				const variantId = variant.id ?? v7();
				const variantInsertValues = {
					id: variantId,
					messageId,
					matches: variant.matches ?? [],
					pattern: variant.pattern ?? [],
				};
				const variantUpdateValues = {
					messageId,
					matches: variant.matches ?? [],
					pattern: variant.pattern ?? [],
				};
				try {
					await trx.insertInto("variant").values(variantInsertValues).execute();
				} catch (error) {
					if (isUniqueConstraintError(error)) {
						await trx
							.updateTable("variant")
							.set(variantUpdateValues)
							.where("id", "=", variantId)
							.execute();
					} else {
						throw error;
					}
				}
			}
		}
	});
};
