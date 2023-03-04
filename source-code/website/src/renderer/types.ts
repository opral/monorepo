import type { Component } from "solid-js"
import type { PageContextBuiltIn } from "vite-plugin-ssr"
import type { passToClient } from "./_default.page.server.jsx"

/**
 * The page context available during rendering.
 */
export type PageContextRenderer<PageProps = Record<string, unknown>> =
	PageContextBuiltIn<Component> & {
		/**
		 * The properties of a page.
		 */
		pageProps: PageProps
	}

/**
 * The page context that is available on the client.
 *
 * The avaiable page context is determined by the `passToClient`
 * export in [_default.page.server.jsx](./_default.page.server.jsx).
 *
 * @example
 * ```ts
 *		type Props = {
 *   		foo: string;
 * 		};
 *		function Page(pageContext: PageContext<Props>)
 * ```
 *
 */
// urlParsed is available by default #246
export type PageContext<PageProps = Record<string, unknown>> = Pick<
	PageContextRenderer<PageProps>,
	(typeof passToClient)[number]
> & { urlParsed: PageContextRenderer["urlParsed"] }

/**
 * The return of a `onBeforeRender` hook.
 *
 * @example
 * ```ts
 * 		export function onBeforeRender(pageContext: PageContextRenderer): OnBeforeRender {
 * 			// ....
 * 		}
 * ```
 */
export type OnBeforeRender<PageProps> = (pageContext: PageContextRenderer) => Promise<{
	pageContext: {
		pageProps: PageProps
	}
}>
