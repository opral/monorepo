import { currentPageContext } from "#src/renderer/state.js"
import { rpc } from "@inlang/rpc"

export async function onBeforeRender() {
	const category = currentPageContext.urlParsed.pathname.replace("/c/", "")
	const results = await rpc.search({ term: category, category: true })

	const items = JSON.parse(results.data).map((item: any) => {
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
