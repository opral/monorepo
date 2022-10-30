import { createSignal, type Accessor, type Setter } from "solid-js";
import type { PageContext } from "./types.js";

/**
 * The current page context.
 *
 * The page context is (and must be) set by the renderers, either server-side or client-side.
 */
export const [currentPageContext, setCurrentPageContext] =
	// type casting to avoid undefined type.
	// the assumption is made that the renderers will set current page context
	createSignal() as [Accessor<PageContext>, Setter<PageContext>];
