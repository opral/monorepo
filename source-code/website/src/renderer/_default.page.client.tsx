import { hydrate, render as solidRender } from "solid-js/web";
import { setCurrentPageContext } from "./state.js";
import { ThePage } from "./ThePage.jsx";
import type { PageContextRenderer } from "./types.js";

// see https://vite-plugin-ssr.com/clientRouting#page-content
export const clientRouting = true;

let isFirstRender = true;
const rootElement = document.querySelector("#root") as HTMLElement;

export function render(pageContext: PageContextRenderer) {
	setCurrentPageContext(pageContext);
	if (pageContext.isServerSideRendered === true) {
		console.log("hydration");
		hydrate(() => <ThePage></ThePage>, rootElement);
		pageContext.isServerSideRendered = false;
		isFirstRender = false;
	} else if (isFirstRender) {
		console.log("first render");
		solidRender(() => <ThePage></ThePage>, rootElement);
		isFirstRender = false;
	}
}
