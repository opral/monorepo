import { Accessor, Component, ErrorBoundary, JSXElement } from "solid-js";
import type { PageContextRenderer } from "./types.js";
import { Dynamic } from "solid-js/web";
// TODO #168 lazy load layouts
// TODO see https://www.solidjs.com/tutorial/async_lazy
import { Layout as IndexLayout } from "@src/pages/Layout.jsx";
import { Layout as EditorLayout } from "@src/pages/editor/Layout.jsx";
import { currentPageContext } from "./state.js";
import { LocalStorageProvider } from "@src/services/local-storage/index.js";

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
		if (currentPageContext().urlParsed.pathname.includes("/editor") === true) {
			return EditorLayout;
		}
		return FallbackLayout;
	};
	return (
		<ErrorBoundary
			fallback={(error) => {
				console.error(error);
				return (
					<>
						<p class="text-danger text-lg font-medium">
							ERROR DURING RENDERING
						</p>
						<p class="text-danger">
							Check the console for more information and please{" "}
							<a
								class="link text-primary"
								target="_blank"
								href="https://github.com/inlang/inlang/issues/new/choose"
							>
								report the bug.
							</a>
						</p>
						<p class="bg-danger-container text-on-danger-container rounded p-2 mt-4">
							{error?.toString()}
						</p>
					</>
				);
			}}
		>
			<LocalStorageProvider>
				<Dynamic component={Layout()}>
					<Dynamic component={props.page} {...props.pageProps}></Dynamic>
				</Dynamic>
			</LocalStorageProvider>
		</ErrorBoundary>
	);
}

function FallbackLayout(props: { children: JSXElement }) {
	return props.children;
}
