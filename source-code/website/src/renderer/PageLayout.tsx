import type { Accessor, Component, JSXElement } from "solid-js";
import type { PageContext, PageContextRenderer } from "./types.js";
import { Dynamic } from "solid-js/web";
import { Layout as IndexLayout } from "@src/pages/Layout.jsx";
import { currentPageContext } from "./state.js";

export type PageLayoutProps = Accessor<{
	pageContext: PageContextRenderer;
}>;

/**
 * Nested layout(s).
 *
 * Vite Plugin SSR does not support Next.js like nested layout yet.
 * Therefore, nested layouts need to be manually implemented.
 *
 * Read more https://vite-plugin-ssr.com/layouts#nested-layouts.
 */
export function PageLayout(props: {
	page: Component;
	pageProps: Record<string, unknown>;
}) {
	const Layout = () => {
		if (currentPageContext().urlParsed.pathname.includes("/editor") === false) {
			return IndexLayout;
		}
		return FallbackLayout;
	};
	return (
		<Dynamic component={Layout()}>
			<Dynamic component={props.page} {...props.pageProps}></Dynamic>
		</Dynamic>
	);
}

function FallbackLayout(props: { children: JSXElement }) {
	return props.children;
}
