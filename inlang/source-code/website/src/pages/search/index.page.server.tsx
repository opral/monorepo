import { rpc } from "@inlang/rpc"

export async function onBeforeRender(pageContext: any) {
	const { q } = pageContext.urlParsed.search

	const results = await rpc.search({ term: q })

	const items = JSON.parse(results.data as string).map((item: any) => {
		item.uniqueID = item.objectID
		delete item.readme
		delete item.objectID
		return item
	})

	return {
		pageContext: {
			pageProps: {
				items: items,
			},
		},
	}
}
