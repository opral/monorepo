import { html } from "lit"
import { dangerouslySkipEscape, escapeInject } from "vike/server"
import { PageContextServer } from "vike/types"
import { collectResult } from "@lit-labs/ssr/lib/render-result.js"
import { render } from "@lit-labs/ssr"
import { kebabCasePageId } from "./kebabCasePageId.ts"
import { unsafeHTML } from "lit/directives/unsafe-html.js"

// https://vike.dev/onRenderHtml
export async function onRenderHtml(pageContext: PageContextServer) {
	// @ts-expect-error - internal type of vike
	const pageId = kebabCasePageId(pageContext._pageId)
	if (customElements.get(pageId) === undefined) {
		// @ts-expect-error - type is unknown
		customElements.define(pageId, pageContext.Page)
	}
	const content = await collectResult(render(html`${unsafeHTML(`<${pageId}></${pageId}>`)}`))

	return escapeInject`<!DOCTYPE html>
    <html>
      <head>
        <title>Lix - Change Control System</title>
        <link rel="stylesheet" href="./src/style.css">
        <link rel="icon" type="image/x-icon" href="/favicon.svg">
      </head>
      <body>
       ${dangerouslySkipEscape(content)}
      </body>
    </html>`
}
