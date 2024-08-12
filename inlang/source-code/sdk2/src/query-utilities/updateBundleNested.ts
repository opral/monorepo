import type { Kysely } from "kysely";
import type { BundleNested } from "../schema/schemaV2.js";
import { json } from "./toJSONRawBuilder.js";
import type { InlangDatabaseSchema } from "../database/schema.js";

export const updateBundleNested = async (
	db: Kysely<InlangDatabaseSchema>,
	bundle: BundleNested
): Promise<void> => {
	await db
		.updateTable("bundle")
		.set({
			id: bundle.id,
			alias: json(bundle.alias),
		})
		.where("id", "=", bundle.id)
		.execute();

	for (const message of bundle.messages) {
		await db
			.updateTable("message")
			.set({
				id: message.id,
				bundleId: bundle.id,
				locale: message.locale,
				declarations: json(message.declarations),
				selectors: json(message.selectors),
			})
			.where("id", "=", message.id)
			.execute();

		for (const variant of message.variants) {
			await db
				.updateTable("variant")
				.set({
					id: variant.id,
					messageId: message.id,
					match: json(variant.match),
					pattern: json(variant.pattern),
				})
				.where("id", "=", variant.id)
				.execute();
		}
	}
};
