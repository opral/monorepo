import type { BundleNested } from "../../schema/schemaV2.js";
import type { InlangProject } from "../api.js";
import { json } from "./toJSONRawBuilder.ts";

export const insertNestedBundle = async (
	project: InlangProject | undefined,
	bundle: BundleNested
): Promise<void> => {
	if (project === undefined) {
		throw new Error("Project is undefined");
	}
	await project.db
		.insertInto("bundle")
		.values({
			id: bundle.id,
			alias: json(bundle.alias),
		})
		.returning("id")
		.execute();

	for (const message of bundle.messages) {
		await project.db
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
			await project.db
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

	bundle.messages.forEach(async (message) => {});
};
