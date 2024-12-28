import { search } from "#src/services/search/index.js";

export default async function onBeforeRender(pageContext: any) {
	const { q } = pageContext.urlParsed.search;

	const results = await search({ term: q });

	let items = JSON.parse(results.data as string).map((item: any) => {
		item.uniqueID = item.objectID;
		delete item.readme;
		delete item.objectID;
		return item;
	});

	items = items.filter((i: any) => i.keywords.includes("external") === false);

	return {
		pageContext: {
			pageProps: {
				items: items,
			},
		},
	};
}
