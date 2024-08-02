import { InlangProject, NestedBundle } from "@inlang/sdk2";

export const insertNestedBundle = async (
	project: InlangProject | undefined,
	bundle: NestedBundle
): Promise<void> => {
	if (project === undefined) {
		throw new Error("Project is undefined");
	}
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
