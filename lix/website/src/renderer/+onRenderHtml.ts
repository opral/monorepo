import { dangerouslySkipEscape, escapeInject } from "vike/server"
import { PageContextServer } from "vike/types"
import { collectResult } from "@lit-labs/ssr/lib/render-result.js"
import { render } from "@lit-labs/ssr"

// https://vike.dev/onRenderHtml
export async function onRenderHtml(pageContext: PageContextServer) {
	// @ts-expect-error - internal type of vike
	const template = pageContext.Page()
	const content = await collectResult(render(template))

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
