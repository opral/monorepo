// `usePageContext` allows us to access `pageContext` in any React component.
// See https://vite-plugin-ssr.com/pageContext-anywhere

import React, { useContext } from "react";
import type { PageContext } from "../types.js";

const Context = React.createContext<PageContext | undefined>(undefined);

/**
 * PageContext Provider
 * 
 *  
 */
export function PageContextProvider(props: { pageContext: PageContext, children: React.ReactNode }) {
	return <Context.Provider value={props.pageContext}>{props.children}</Context.Provider>;
}

/**
 * `usePageContext` to access PageContext in any React component.
 * 
 * @example
 * 	function MyComponent() {
 * 		const pageContext = usePageContext();
 * 	} 
 */
export function usePageContext(): PageContext {
	const pageContext = useContext(Context);
	if (pageContext === undefined) {
		throw new Error("usePageContext must be used within a PageContextProvider.\Has the PageContextProvider been rendered?");
	}
	return pageContext;
}
