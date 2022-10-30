import type { Component } from "solid-js";
import type { PageContextBuiltIn } from "vite-plugin-ssr";

export type PageProps = {};
export type PageContext = PageContextBuiltIn<Component> & {
	pageProps: PageProps;
	exports: {
		documentProps?: {
			title?: string;
			description?: string;
		};
	};
};
