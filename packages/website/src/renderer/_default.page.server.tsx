import type { PageContextRenderer } from "./types.js"
import { generateHydrationScript, renderToString } from "solid-js/web"
import { escapeInject, dangerouslySkipEscape } from "vite-plugin-ssr/server"
import { setCurrentPageContext } from "./state.js"
import { Root } from "./Root.jsx"

// import the css
import "./app.css"
import { MetaProvider, renderTags } from "@solidjs/meta"

// See https://vite-plugin-ssr.com/data-fetching
export const passToClient = ["pageProps", "routeParams", "locale"] as const

export async function render(pageContext: PageContextRenderer): Promise<unknown> {
	//! TODO most likely cross request state pollution
	//! Need to look into this in the future
	setCurrentPageContext(pageContext)
	// generating the html from the server:
	// 1. the server sends a hydration script for the client.
	//    the client uses the hydration script to hydrate the page.
	//    without hydration, no interactivity.
	// 2. the page is pre-rendered via `renderedPage`.
	//    pre-rendering the page makes the page immediately "visible"
	//    to the user. Afterwards, the client hydrates the page and thereby
	//    makes the page interactive.
	// ! important: renderToString is used instead of
	// ! renderToStringAsync some async resources should
	// ! not be loaded on the server (the editor for example).
	// ! see https://github.com/inlang/inlang/issues/247

	// from solidjs meta
	// mutated during render so you can include in server-rendered template later
	const tags: any[] = []

	const isEditor = pageContext.urlPathname.startsWith("editor")

	const renderedPage = isEditor
		? undefined
		: renderToString(() => (
				<MetaProvider tags={tags}>
					<Root
						page={pageContext.Page}
						pageProps={pageContext.pageProps}
						locale={pageContext.locale}
					/>
				</MetaProvider>
		  ))

	return escapeInject`<!DOCTYPE html>
    <html lang="en" class="min-h-screen min-w-screen">
      <head>
			<meta charset="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<!-- theme-color means the background color of the iOS status bar -->
			<meta name="theme-color" content="#000000" />
		<!-- START import inter font -->
			<link rel="preconnect" href="https://rsms.me/">
			<link rel="stylesheet" href="https://rsms.me/inter/inter.css">
		<!-- END import inter font -->
			${dangerouslySkipEscape(import.meta.env.PROD ? analytics : "")}
			${dangerouslySkipEscape(favicons)}
			${dangerouslySkipEscape(generateHydrationScript())}
			${dangerouslySkipEscape(renderTags(tags))}
      </head>
	  <!-- setting min-h/w-screen to allow child elements to span to the entire screen  -->
      <body class="min-h-screen min-w-screen bg-background text-on-background" id="root">
		    ${isEditor ? "" : dangerouslySkipEscape(renderedPage!)}
      </body>
    </html>`
}

const favicons = `
<link rel="apple-touch-icon" sizes="180x180" href="favicon/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png">
<link rel="manifest" href="/favicon/site.webmanifest">
<link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#5bbad5">
<meta name="msapplication-TileColor" content="#da532c">
<meta name="theme-color" content="#ffffff">
`

const analytics = `
<script async src="https://www.googletagmanager.com/gtag/js?id=G-5H3SDF7TVZ"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-5H3SDF7TVZ');
</script>
`
