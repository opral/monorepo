import { InlangProject, NestedBundle } from "@inlang/sdk2";

export const insertNestedBundle = async (
	project: InlangProject,
	bundle: NestedBundle
): Promise<void> => {
	const x = await project.db
		.insertInto("bundle")
		.values({
			id: bundle.id,
			alias: JSON.stringify(bundle.alias),
		})
		.returning("id")
		.execute();
	console.log({ x });
};
