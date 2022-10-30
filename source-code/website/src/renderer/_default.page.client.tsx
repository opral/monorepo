import { createSignal } from "solid-js";
import { hydrate } from "solid-js/web";
import { PageLayout } from "./PageLayout.jsx";

import type { PageContext } from "./types.js";

// see https://vite-plugin-ssr.com/clientRouting#page-content
export const clientRouting = true;

// is hydrated means the page has been server-side rendered and the
// client took over. If isHydrated is `false`, the client needs to
// take over rendering.
let isHydrated = false;

// wrapping the page context in a signal makes client side rendering
// reactive. If the page context changes, <PageLayout> will render a
// new page.
const [currentPageContext, setCurrentPageContext] = createSignal<PageContext>();

export function render(pageContext: PageContext) {
	setCurrentPageContext(pageContext);
	if (isHydrated === false) {
		// the page has been rendered server-side, so we need to hydrate it
		hydrate(
			() => <PageLayout {...currentPageContext()!} />,
			document.getElementById("root")!
		);
		isHydrated = true;
	}
}
