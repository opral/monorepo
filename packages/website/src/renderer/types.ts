import type { Component } from "solid-js";
import type { PageContextBuiltIn } from "vite-plugin-ssr";
import type { passToClient } from "./_default.page.server.jsx";

/** A string that contains html that is supposed to be injected into markup  */
// utility type to signal that this is a string containing html
type HTMLString = string;

/**
 * The <head> content that is supposed to be injected for a given Page.
 *
 * The title must be a regular string to modify the `document.title` on client-side navigation.
 * Meta is a string with HTML that contains elements that are injected into the head on SSR.
 *
 * @example
 * 	const Head: PageHead = (props) => ({
 * 		title: "Home",
 * 		description: "Inlang is developer-first localization infrastructure...",
 * 		meta: `
 * 			<meta content="..." />
 * 			<meta ...>
 * 		`
 * 	})
 *
 */
export type PageHead<PageProps = Record<string, unknown>> = (props: {
	pageContext: PageContext<PageProps>;
}) => {
	/**
	 * The title of the Page.
	 *
	 *	@example
	 * 		title: "Home"
	 */
	title: string;
	/**
	 * The description of the Page (for SEO purposes).
	 *
	 * Provide a description for SEO that does not exceed 150 characters.
	 */
	description: string;
	/**
	 * The html meta elements that should be injected into the head.
	 *
	 * @example
	 * 	  	elements: `
	 * 			<meta name="description" content="Inlang is ..." />
	 * 			<meta ...>
	 * 		`
	 */
	meta?: HTMLString;
};

/**
 * The page context available during rendering.
 */
export type PageContextRenderer<PageProps = Record<string, unknown>> =
	PageContextBuiltIn<Component> & {
		/**
		 * The properties of a page.
		 */
		pageProps: PageProps;
		/**
		 * Things that a file that contains a Page exports.
		 *
		 * Like a Head object.
		 */
		exports: {
			/** must be defined to provide information about the rendered page */
			Head: PageHead;
		};
	};

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
	typeof passToClient[number]
> & { urlParsed: PageContextRenderer["urlParsed"] };

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
export type OnBeforeRender<PageProps> = (
	pageContext: PageContextRenderer
) => Promise<{
	pageContext: {
		pageProps: PageProps;
	};
}>;
