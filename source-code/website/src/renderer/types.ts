import type React from "react";
import type { PageContextBuiltIn } from "vite-plugin-ssr";

export type PageProps = {};
export type PageContext = PageContextBuiltIn<React.ElementType> & {
	pageProps: PageProps;
	exports: {
		documentProps?: {
			title?: string;
			description?: string;
		};
	};
};
