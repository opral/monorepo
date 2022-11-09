import { Accessor, Component, ErrorBoundary, JSXElement } from "solid-js";
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
		<ErrorBoundary
			fallback={(error) => {
				console.error(error);
				return (
					<>
						<p class="text-error text-lg font-medium">ERROR DURING RENDERING</p>
						<p class="text-error">
							Check the console for more information and please{" "}
							<a
								class="link"
								href="https://github.com/inlang/inlang/issues/new/choose"
							>
								report the bug.
							</a>
						</p>
					</>
				);
			}}
		>
			<Dynamic component={Layout()}>
				<Dynamic component={props.page} {...props.pageProps}></Dynamic>
			</Dynamic>
		</ErrorBoundary>
	);
}

function FallbackLayout(props: { children: JSXElement }) {
	return props.children;
}
