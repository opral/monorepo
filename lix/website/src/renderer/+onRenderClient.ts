import { hydrate } from "@lit-labs/ssr-client"
import "@lit-labs/ssr-client/lit-element-hydrate-support.js"

export async function onRenderClient(pageContext) {
	const page = pageContext.Page()
	page.renderRoot = document.body
	hydrate(page, document.body)
}
