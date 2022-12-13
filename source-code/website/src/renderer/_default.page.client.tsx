import { Component, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { hydrate } from "solid-js/web";
import { ThePage } from "./ThePage.jsx";
import { setCurrentPageContext } from "./state.js";
import type { PageContextRenderer } from "./types.js";
// only imported client side as web components are not supported server side
// importing the shoelace components that are used.
import "@shoelace-style/shoelace/dist/components/alert/alert.js";
import "@shoelace-style/shoelace/dist/components/badge/badge.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/dialog/dialog.js";
import "@shoelace-style/shoelace/dist/components/dropdown/dropdown.js";
import "@shoelace-style/shoelace/dist/components/menu/menu.js";
import "@shoelace-style/shoelace/dist/components/menu-item/menu-item.js";
import "@shoelace-style/shoelace/dist/components/details/details.js";
import "@shoelace-style/shoelace/dist/components/textarea/textarea.js";
import "@shoelace-style/shoelace/dist/components/tag/tag.js";
import "@shoelace-style/shoelace/dist/components/tooltip/tooltip.js";
import "@shoelace-style/shoelace/dist/components/card/card.js";
import "@shoelace-style/shoelace/dist/components/input/input.js";
import "@shoelace-style/shoelace/dist/components/divider/divider.js";
import "@shoelace-style/shoelace/dist/components/tree/tree.js";
import "@shoelace-style/shoelace/dist/components/tree-item/tree-item.js";

// see https://vite-plugin-ssr.com/clientRouting#page-content
export const clientRouting = true;

let isFirstRender = true;
const rootElement = document.querySelector("#root") as HTMLElement;

const [currentPage, setCurrentPage] = createSignal<Component>();
const [currentPageProps, setCurrentPageProps] = createStore<
	Record<string, unknown>
>({});

export function render(pageContext: PageContextRenderer) {
	try {
		setCurrentPageContext(pageContext);
		setCurrentPage(() => pageContext.Page);
		setCurrentPageProps(pageContext.pageProps);
		if (isFirstRender) {
			hydrate(
				() => (
					<ThePage page={currentPage()!} pageProps={currentPageProps}></ThePage>
				),
				rootElement
			);
			isFirstRender = false;
		}
	} catch (e) {
		console.error("ERROR in renderer", e);
	}
}
