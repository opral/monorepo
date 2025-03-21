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

	// Filter out unlisted items
	items = items.filter((item) => {
		// Check the unlisted property first, then fall back to keywords for backward compatibility
		// Using type assertion to handle the new unlisted property
		return (item as any).unlisted !== true && !item.keywords.includes("external") && !item.keywords.includes("unlisted");
	});

	return {
		pageContext: {
			pageProps: {
				items: items,
			},
		},
	};
}
