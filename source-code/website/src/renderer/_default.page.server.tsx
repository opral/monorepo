import type { PageContextRenderer } from "./types.js";
import { generateHydrationScript, renderToString } from "solid-js/web";
import { escapeInject, dangerouslySkipEscape } from "vite-plugin-ssr";
import "./app.css";
import { setCurrentPageContext } from "./state.js";
import { PageLayout } from "./PageLayout.jsx";

// See https://vite-plugin-ssr.com/data-fetching
export const passToClient = ["pageProps", "routeParams", "urlParsed"] as const;

export function render(pageContext: PageContextRenderer): unknown {
	//! TODO most likely cross request state pollution
	//! Need to look into this in the future
	setCurrentPageContext(pageContext);
	// metadata of the page.
	const { Head } = pageContext.exports;
	const head = Head?.({ pageContext });
	const title = head?.title ?? "inlang";
	const description = head?.description ?? "";
	// generating the html from the server:
	// 1. the server sends a hydration script for the client.
	//    the client uses the hydration script to hydrate the page.
	//    without hydration, no interactivity.
	// 2. the page is pre-rendered via `renderedPage`.
	//    pre-rendering the page makes the page immediately "visible"
	//    to the user. Afterwards, the client hydrates the page and thereby
	//    makes the page interactive.
	const renderedPage = renderToString(() => (
		<PageLayout
			page={pageContext.Page}
			pageProps={pageContext.pageProps}
		></PageLayout>
	));
	return escapeInject`<!DOCTYPE html>
    <html lang="en" class="min-h-screen min-w-screen">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>${title}</title>
        <meta name="description" content="${description}" />
		<!-- START import inter font -->
		<link rel="preconnect" href="https://rsms.me/">
		<link rel="stylesheet" href="https://rsms.me/inter/inter.css">
		<!-- END import inter font -->
		${dangerouslySkipEscape(favicons)}
        ${dangerouslySkipEscape(generateHydrationScript())}
      </head>
      <body class="min-h-screen min-w-screen">
	<!-- setting min-h/w-screen to allow child elemtest to the entire screen  -->
        <div class="min-h-screen min-w-screen" id="root">
			${dangerouslySkipEscape(renderedPage)}
		</div>
      </body>
    </html>`;
}

const favicons = `
<link rel="apple-touch-icon" sizes="180x180" href="favicon/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png">
<link rel="manifest" href="/favicon/site.webmanifest">
<link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#5bbad5">
<meta name="msapplication-TileColor" content="#da532c">
<meta name="theme-color" content="#ffffff">
`;
