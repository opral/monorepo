import type { PageContextRenderer } from "./types.js";
import {
	generateHydrationScript,
	renderToString,
	renderToStringAsync,
} from "solid-js/web";
import { escapeInject, dangerouslySkipEscape } from "vike/server";
import { setCurrentPageContext } from "./state.js";
import Root from "./+Root.jsx";

// import the css
import "./app.css";
import { MetaProvider, renderTags } from "@solidjs/meta";
import { languageTag } from "#src/paraglide/runtime.js";

// See https://vike.dev/data-fetching
export const passToClient = [
	"pageProps",
	"routeParams",
	"languageTag",
	"data",
] as const;

export default async function onRenderHtml(
	pageContext: PageContextRenderer
): Promise<unknown> {
	//! TODO most likely cross request state pollution
	//! Need to look into this in the future
	setCurrentPageContext(pageContext);
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
	// ! see https://github.com/opral/inlang/issues/247

	// from solidjs meta
	// mutated during render so you can include in server-rendered template later
	const tags: any[] = [];

	const renderedPage = renderToString(() => (
		<MetaProvider tags={tags}>
			<Root
				page={pageContext.Page}
				pageProps={pageContext.pageProps}
				data={pageContext.data}
			/>
		</MetaProvider>
	));

	return escapeInject`<!DOCTYPE html>
    <html lang="${dangerouslySkipEscape(
			languageTag()
		)}" class="min-h-screen min-w-screen overflow-x-hidden">
      <head>
			<meta charset="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@docsearch/css@3"/>
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
      <body class="website min-h-screen min-w-screen bg-background text-on-background" id="root">
		    ${dangerouslySkipEscape(renderedPage!)}
				<script src="https://cdn.jsdelivr.net/npm/@docsearch/js@3"></script>
				<script type="text/javascript">
				docsearch({
				appId: "X5BTW6ZBA0",
				apiKey: "cf9a270f5245cc74b48013b6e47d7197",
				indexName: "inlang",
				insights: true,
				container: "#search-input",
				debug: false 
				});
				</script>
      </body>
    </html>`;
}

const favicons = `
<link rel="apple-touch-icon" sizes="180x180" href="https://inlang.com/favicon/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="https://inlang.com/favicon/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="https://inlang.com/favicon/favicon-16x16.png">
<link rel="manifest" href="https://inlang.com/favicon/site.webmanifest">
<link rel="mask-icon" href="https://inlang.com/favicon/safari-pinned-tab.svg" color="#5bbad5">
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
