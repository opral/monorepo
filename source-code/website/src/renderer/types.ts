import type { Component } from "solid-js";
import type { PageContextBuiltIn } from "vite-plugin-ssr";

/**
 * The <head> content of a page.
 */
export type PageHead = (args: { pageContext: PageContext }) => {
	title?: string;
	description?: string;
};

/**
 * The page context
 */
export type PageContext = PageContextBuiltIn<Component> & {
	/**
	 * Properties of the rendered page.
	 */
	pageProps: Record<string, unknown>;
	/**
	 * Things that a file that contains a Page exports.
	 *
	 * Like a Head object.
	 */
	exports?: {
		Head?: PageHead;
	};
};

/**
 * The return of a `onBeforeRender` hook.
 */
export type OnBeforeRender = {
	pageContext: Pick<PageContext, "pageProps">;
};
