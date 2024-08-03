import { InlangProject, BundleNested } from "@inlang/sdk2";

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
				alias: JSON.stringify(bundle.alias),
			})
			.returning("id")
			.execute();

	bundle.messages.forEach(async (message) => {
		await project.db
			.insertInto("message")
			.values({
				id: message.id,
				bundleId: bundle.id,
				locale: message.locale,
				declarations: JSON.stringify(message.declarations),
				selectors: JSON.stringify(message.selectors),
			})
			.execute();

		message.variants.forEach(async (variant) => {
			await project.db
				.insertInto("variant")
				.values({
					id: variant.id,
					messageId: message.id,
					match: JSON.stringify(variant.match),
					pattern: JSON.stringify(variant.pattern),
				})
				.execute();
		});
	});
};
