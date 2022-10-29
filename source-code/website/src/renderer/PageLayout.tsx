import type { PageContext } from "./types.js";

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
	switch (props.pageContext.urlPathname) {
		// case "/":
		// 	return <Index>{props.children}</Index>;
		default:
			return <>{props.children}</>;
	}
}
