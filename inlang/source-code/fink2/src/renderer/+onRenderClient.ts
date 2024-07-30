import { html, render } from "lit"
import type { OnRenderClientSync } from "vike/types"
import "../state.js"
import { IndexLayout } from "../layout.js"
import { unsafeHTML } from "lit/directives/unsafe-html.js"

// render(html` <app-state> </app-state> `, document.body)

export const onRenderClient: OnRenderClientSync = (pageContext) => {
	const tag = pageContext.exports["PageElementTag"]
	// @ts-expect-error - pageContext.Page is unknown
	if (!customElements.get(tag)) {
		customElements.define(tag, pageContext.Page)
	}
	const root = document.body
	render(
		html` <app-state> <fink-layout> <a href="/subpage">go to subpage ABC</a> ${unsafeHTML(
			`<${tag}></${tag}>`
		)} </app-state> <fink-layout>`,
		root!
	)
}
