import { render } from "lit"
import type { OnRenderClientSync } from "vike/types"
import { html } from "lit/static-html.js"

export const onRenderClient: OnRenderClientSync = (pageContext) => {
	// @ts-expect-error - pageContext.Page is unknown
	const tag = pageContext.exports["PageElementTag"]
	customElements.define(tag, pageContext.Page)
	const root = document.getElementById("app")
	render(new pageContext.Page(), root!)
}
