import { Dynamic, render as solidRender } from "solid-js/web";
import { currentPageContext, setCurrentPageContext } from "./state.js";
import type { PageContextRenderer } from "./types.js";

// see https://vite-plugin-ssr.com/clientRouting#page-content
export const clientRouting = true;

let isFirstRender = true;

export function render(pageContext: PageContextRenderer) {
	// setting the current page context triggers reactive changing
	// of the curent page.
	setCurrentPageContext(pageContext);
	// therefore, the site only needs to be rendered once.
	if (isFirstRender) {
		const rootElement = document.querySelector("#root") as HTMLElement;
		solidRender(
			() => (
				<Dynamic
					component={(currentPageContext() as PageContextRenderer).Page}
					{...currentPageContext()?.props}
				></Dynamic>
			),
			rootElement
		);
		isFirstRender = false;
	}
}
