import { escapeInject, dangerouslySkipEscape } from "vite-plugin-ssr";
import type { PageContext } from "./types.js";
import { PageLayout } from "./PageLayout.js";
import { renderToString } from "react-dom/server";

// including global css
import "./app.css";

// See https://vite-plugin-ssr.com/data-fetching
export const passToClient = ["pageProps"];

export function render(pageContext: PageContext): unknown {
	// metadata of the page.
	const { documentProps } = pageContext.exports;
	const title = documentProps?.title ?? "Inlang";
	const description = documentProps?.description ?? "";
	// generating the html from the server:
	// 1. the server sends a hydration script for the client.
	//    the client uses the hydration script to hydrate the page.
	//    without hydration, no interactivity.
	// 2. the page is pre-rendered via `renderedPage`.
	//    pre-rendering the page makes the page immediately "visible"
	//    to the user. Afterwards, the client hydrates the page and thereby
	//    makes the page interactive.
	const { Page, pageProps } = pageContext;
	const renderedPage = renderToString(
		<PageLayout pageContext={pageContext}>
			<Page {...pageProps}></Page>
		</PageLayout>
	);
	return escapeInject`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="${description}" />
        <title>${title}</title>
      </head>
      <body>
        <div id="root">${dangerouslySkipEscape(renderedPage)}</div>
      </body>
    </html>`;
}
