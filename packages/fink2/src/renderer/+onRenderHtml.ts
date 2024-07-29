import { escapeInject } from "vike/server"
import type { OnRenderHtmlSync } from "vike/types"
import "../style.css"

// https://vike.dev/onRenderHtml
export const onRenderHtml: OnRenderHtmlSync = () => {
	return escapeInject`<!DOCTYPE html>
    <html>
      <head>
        <title>Fink 2 - CAT editor</title>
        <link rel="icon" type="image/x-icon" href="/favicon.svg">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=0">
      </head>
      <body>
        <div id="app"></div>
      </body>
    </html>`
}
