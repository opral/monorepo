import { hydrateRoot, type Root } from "react-dom/client";
import { PageLayout } from "./PageLayout.js";

import type { PageContext } from "./types.js";

// see https://vite-plugin-ssr.com/clientRouting#page-content
export const clientRouting = true;

// is hydrated means the page has been server-side rendered and the
// client took over. If isHydrated is `false`, the client needs to
// take over rendering.
let root: Root;

export function render(pageContext: PageContext) {
	const { Page, pageProps } = pageContext;

	const PageWithLayout = (
		<PageLayout pageContext={pageContext}>
			<Page {...pageProps}></Page>
		</PageLayout>
	);

	if (root === undefined) {
		// the page has been rendered server-side, hydration is required
		root = hydrateRoot(document.getElementById("root")!, PageWithLayout);
	} else {
		// page has been hydrated, client-side routing is taking over
		root.render(PageWithLayout);
	}
}
