import { InlangProject, selectBundleNested } from "@inlang/sdk";

export default async function getSortedBundles(project: InlangProject) {
	// Step 1: Query all bundles from the Inlang database
	const bundles = await selectBundleNested(project.db).execute();

	// Step 2: Create a mapping of bundle IDs to their creation dates from the Lix changes
	const bundleIdToCreationDate = new Map<string, string>();
	for (const bundle of bundles) {
		const createChange = await project.lix.db
			.selectFrom("change")
			.selectAll()
			.where("change.operation", "=", "create")
			.where("change.type", "=", "bundle")
			.where((eb) => eb.ref("value", "->>").key("id"), "=", bundle.id)
			.orderBy("change.created_at desc")
			.executeTakeFirst();
		if (createChange) {
			bundleIdToCreationDate.set(bundle.id, createChange.created_at);
		}
	}

	// console.log(bundleIdToCreationDate);

	// Step 3: Sort the bundles by their creation dates newest to oldest
	const sortedBundles = bundles.sort((a, b) => {
		const aDate = bundleIdToCreationDate.get(a.id);
		const bDate = bundleIdToCreationDate.get(b.id);
		if (!aDate || !bDate) {
			return 0;
		}
		return new Date(bDate).getTime() - new Date(aDate).getTime();
	});

	return sortedBundles; // Newest bundles first
}
