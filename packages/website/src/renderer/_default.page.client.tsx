import { Component, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { Dynamic, hydrate, render as renderSolid } from "solid-js/web";
import { PageLayout } from "./PageLayout.jsx";
import { currentPageContext, setCurrentPageContext } from "./state.js";
import type { PageContextRenderer } from "./types.js";

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
		setCurrentPageProps(pageContext.props);
		if (isFirstRender) {
			// TODO switch to hydrate once solidjs 'nextSibling' bug is fixed
			// TODO https://github.com/solidjs/solid/issues/1345
			rootElement.innerHTML = "";
			renderSolid(
				() => (
					<PageLayout
						page={currentPage()!}
						pageProps={currentPageProps}
					></PageLayout>
				),
				rootElement
			);
			isFirstRender = false;
		}
	} catch (e) {
		console.error("ERROR in renderer", e);
	}
}
