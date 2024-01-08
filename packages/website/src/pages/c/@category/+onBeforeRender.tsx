import { rpc } from "@inlang/rpc"
import { render } from "vike/abort"

export default async function onBeforeRender(pageContext: any) {
	const { q } = pageContext.urlParsed.search
	const { category } = pageContext.routeParams
	const results = await rpc.search({
		term: q ? category + " " + q : category,
		category: q ? false : true,
	})

	let items = JSON.parse(results.data as string).map((item: any) => {
		item.uniqueID = item.objectID
		delete item.readme
		delete item.objectID
		return item
	})

	items = items.filter((i: any) => i.keywords.includes("external") === false)

	if (!q && items.length === 0) {
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
