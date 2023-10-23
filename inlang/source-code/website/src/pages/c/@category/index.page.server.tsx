import { currentPageContext } from "#src/renderer/state.js"
import { rpc } from "@inlang/rpc"
import { render } from "vite-plugin-ssr/abort"

export async function onBeforeRender(pageContext: any) {
	const { category } = pageContext.routeParams
	const results = await rpc.search({ term: category, category: true })

	const items = JSON.parse(results.data).map((item: any) => {
		item.uniqueID = item.objectID
		delete item.readme
		delete item.objectID
		return item
	})

	if (items.length === 0) {
		throw render(404)
	}

	return {
		pageContext: {
			pageProps: {
				items: items,
			},
		},
	}
}
