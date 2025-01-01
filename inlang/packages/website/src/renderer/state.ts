import { createStore, type SetStoreFunction } from "solid-js/store";
import type { PageContext, PageContextRenderer } from "./types.js";

/**
 * The current page context.
 *
 * The page context is (and must be) set by the renderers.
 * Note that the page context on the client side is a subset
 * of `PageContextRenderer`. If you are certain that the
 * page context you are accessing is the `PageContextRenderer`,
 * use a type cast `as PageContextRenderer`.
 */
// eslint-disable-next-line solid/reactivity
export const [currentPageContext, setCurrentPageContext] = createStore({}) as [
	PageContext,
	SetStoreFunction<PageContextRenderer>,
];
