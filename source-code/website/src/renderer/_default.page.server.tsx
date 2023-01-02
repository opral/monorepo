import type { PageContextRenderer } from "./types.js";
import { generateHydrationScript, renderToStringAsync } from "solid-js/web";
import { escapeInject, dangerouslySkipEscape } from "vite-plugin-ssr";
import { setCurrentPageContext } from "./state.js";
import { ThePage } from "./ThePage.jsx";

// import the css
import "./app.css";
import { assert } from "@src/services/assert/index.js";

// See https://vite-plugin-ssr.com/data-fetching
export const passToClient = ["pageProps", "routeParams"] as const;

export async function render(
	pageContext: PageContextRenderer
): Promise<unknown> {
	//! TODO most likely cross request state pollution
	//! Need to look into this in the future
	setCurrentPageContext(pageContext);
	// metadata of the page.
	assert(pageContext.exports.Head, "A page must export a Head.");
	const head = pageContext.exports.Head({ pageContext });
	assert(
		head.description.length < 160,
		`A description of a Page should not exceed 160 characters. Otherwise, search engines will truncate the text. The provided description was ${head.description.length} characters long.`
	);
	// generating the html from the server:
	// 1. the server sends a hydration script for the client.
	//    the client uses the hydration script to hydrate the page.
	//    without hydration, no interactivity.
	// 2. the page is pre-rendered via `renderedPage`.
	//    pre-rendering the page makes the page immediately "visible"
	//    to the user. Afterwards, the client hydrates the page and thereby
	//    makes the page interactive.
	const renderedPage = await renderToStringAsync(() => (
		<ThePage
			page={pageContext.Page}
			pageProps={pageContext.pageProps}
		></ThePage>
	));
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
		<!-- START injecting meta tags from Page -->
			<title>${head.title}</title>
			<meta name="description" content="${head.description}" />
			${dangerouslySkipEscape(head.meta ?? "")}
		<!-- END injecting meta tags from Page -->
      </head>
	  <!-- setting min-h/w-screen to allow child elements to span to the entire screen  -->
      <body class="min-h-screen min-w-screen bg-background text-on-background" id="root">
		${dangerouslySkipEscape(renderedPage)}
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

const analytics = `
<script async src="https://www.googletagmanager.com/gtag/js?id=G-5H3SDF7TVZ"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-5H3SDF7TVZ');
</script>
`;
