import { Dynamic, hydrate } from "solid-js/web";
import { currentPageContext, setCurrentPageContext } from "./state.js";
import type { PageContextRenderer } from "./types.js";

// see https://vite-plugin-ssr.com/clientRouting#page-content
export const clientRouting = true;

// is hydrated means the page has been server-side rendered and the
// client took over. If isHydrated is `false`, the client needs to
// take over rendering.
let isHydrated = false;

export function render(pageContext: PageContextRenderer) {
	setCurrentPageContext(pageContext);
	if (isHydrated === false) {
		// 1. the page has been rendered server-side, so we need to hydrate it
		// 2. by passing the currentPageContext, the layout is reactive.
		hydrate(
			() => (
				// need to pass reactive props to the page
				// to have reactive routing
				<Dynamic
					component={(currentPageContext() as PageContextRenderer).Page}
					{...currentPageContext()?.props}
				></Dynamic>
			),
			document.getElementById("root")!
		);
		isHydrated = true;
	}
}

// export function usePageContext(pageContext:PageContext){

// }
