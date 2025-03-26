import { registry } from "@inlang/marketplace-registry";
import { render } from "vike/abort";

export default async function onBeforeRender(pageContext: any) {
	const { q } = pageContext.urlParsed.search;
	const { category } = pageContext.routeParams;

	const categoryValue = (() => {
		switch (category) {
			case "apps":
				return "app";
			case "plugins":
				return "plugin";
			default:
				return undefined;
		}
	})();

	// Filter registry items based on category
	let items = registry
		.filter((item) => {
			// Get the first part of the ID (before the first dot)
			const itemType = item.id.split(".")[0];

			// Match items of the specified category
			if (categoryValue && itemType === categoryValue) {
				return true;
			}

			// Special case: show libraries in apps category (as per the original logic)
			if (categoryValue === "app" && itemType === "library") {
				return true;
			}

			// If no category specified, include all items
			return !categoryValue;
		})
		.map((item) => ({
			...item,
			uniqueID: item.uniqueID,
		}));

	// Filter out deprecated items
	const filteredItems = items.filter((item: any) => item.deprecated !== true);

	if (!q && filteredItems.length === 0) {
		throw render(404);
	}

	return {
		pageContext: {
			pageProps: {
				items: filteredItems,
			},
		},
	};
}
