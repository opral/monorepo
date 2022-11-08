import { createSignal, type Accessor, type Setter } from "solid-js";
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
export const [currentPageContext, setCurrentPageContext] = createSignal() as [
	Accessor<PageContext>,
	Setter<PageContext>
];
