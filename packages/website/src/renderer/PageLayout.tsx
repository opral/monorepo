import type { PageContext } from "./types.js";
import { PageContextProvider } from "./hooks/usePageContext.js";

//! Not implemented yet.
/**
 * Nested layout(s).
 *
 * Vite Plugin SSR does not support Next.js like nested layout yet.
 * Therefore, nested layouts need to be manually implemented.
 *
 * Read more https://vite-plugin-ssr.com/layouts#nested-layouts.
 */
export function PageLayout(props: {
	pageContext: PageContext;
	children: React.ReactNode;
}) {
	const Layout = () => {
		switch (props.pageContext.urlPathname) {
			// case "/":
			// 	return <Index>{props.children}</Index>;
			default:
				return <>{props.children}</>;
		}
	};
	return (
		<WithProviders pageContext={props.pageContext}>{Layout()}</WithProviders>
	);
}

/**
 * Providing context to all pages.
 */
function WithProviders(props: {
	pageContext: PageContext;
	children: React.ReactNode;
}) {
	return (
		<PageContextProvider pageContext={props.pageContext}>
			{props.children}
		</PageContextProvider>
	);
}
