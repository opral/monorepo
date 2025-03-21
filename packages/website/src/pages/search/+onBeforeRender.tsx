import { registry } from "@inlang/marketplace-registry";
import type { MarketplaceManifest } from "@inlang/marketplace-manifest";

type RegistryItem = MarketplaceManifest & { uniqueID: string };

export default async function onBeforeRender(pageContext: any): Promise<{ pageContext: { pageProps: { items: RegistryItem[] } } }> {
	const { q } = pageContext.urlParsed.search;

	let items = [...registry];

	// If there's a search query, filter the registry items
	if (q && q.trim() !== "") {
		const searchTerm = q.toLowerCase();
		items = items.filter((item) => {
			const displayName = typeof item.displayName === "object" 
				? item.displayName.en.toLowerCase() 
				: item.displayName.toLowerCase();
			const description = typeof item.description === "object"
				? item.description.en.toLowerCase()
				: item.description.toLowerCase();
			const keywords = item.keywords.join(" ").toLowerCase();
			
			return displayName.includes(searchTerm) || 
				description.includes(searchTerm) || 
				keywords.includes(searchTerm);
		});
	}

	// Filter out deprecated items
	const filteredItems = items.filter((item) => {
		// Check if the item has the deprecated property
		if ((item as any).deprecated !== undefined) {
			return !(item as any).deprecated;
		}
		// Backward compatibility: check if the item has the "website" keyword
		return item.keywords?.includes("website") ?? false;
	});

	return {
		pageContext: {
			pageProps: {
				items: filteredItems,
			},
		},
	};
}
