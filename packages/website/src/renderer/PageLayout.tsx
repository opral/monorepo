import type { JSXElement } from "solid-js";
import type { PageContext } from "./types.js";
import { Dynamic } from "solid-js/web";
import { EditorLayout } from "@src/editor/EditorLayout.jsx";

/**
 * Nested layout(s).
 *
 * Vite Plugin SSR does not support Next.js like nested layout yet.
 * Therefore, nested layouts need to be manually implemented.
 *
 * Read more https://vite-plugin-ssr.com/layouts#nested-layouts.
 */
export function PageLayout(pageContext: PageContext) {
	const Layout = () => {
		if (pageContext.urlPathname.startsWith("/editor")) {
			return EditorLayout;
		}
		return FallbackLayout;
	};
	return (
		<Dynamic component={Layout()}>
			<Dynamic
				component={pageContext.Page}
				{...pageContext.pageProps}
			></Dynamic>
		</Dynamic>
	);
}

function FallbackLayout(props: { children: JSXElement }) {
	return props.children;
}
