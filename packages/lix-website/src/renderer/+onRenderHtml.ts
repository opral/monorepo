import { dangerouslySkipEscape, escapeInject } from "vike/server"
import { PageContextServer } from "vike/types"
import { collectResult } from "@lit-labs/ssr/lib/render-result.js"
import { render } from "@lit-labs/ssr"
import "../style.css"

// https://vike.dev/onRenderHtml
export async function onRenderHtml(pageContext: PageContextServer) {
	// @ts-expect-error - internal type of vike
	const template = pageContext.Page()
	const content = await collectResult(render(template))

	return escapeInject`<!DOCTYPE html>
    <html>
      <head>
        <title>Lix - Change Control System</title>
        <link rel="icon" type="image/x-icon" href="/favicon.svg">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=0">
      </head>
      <body>
       ${dangerouslySkipEscape(content)}
      </body>
    </html>`
}
