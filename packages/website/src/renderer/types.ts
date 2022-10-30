import type { Component } from "solid-js";
import type { PageContextBuiltIn } from "vite-plugin-ssr";

/**
 * The <head> content of a page.
 */
export type PageHead = (args: { pageContext: PageContext }) => {
	title?: string;
	description?: string;
};

export type PageProps = {};
export type PageContext = PageContextBuiltIn<Component> & {
	pageProps: PageProps;
	/**
	 * Things that a Page exports.
	 */
	exports: {
		Head?: PageHead;
	};
};
