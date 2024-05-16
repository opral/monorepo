// this is a JS file to avoid transpiling in tests

import { getContext, setContext } from "svelte"
import { PARAGLIDE_CONTEXT_KEY } from "../../constants.js"

/**
 * @typedef {{ translateHref: (href: string, hreflang?: string) => string }} ParaglideContext
 */

export const getParaglideContext = () => {
	return /** @type { ParaglideContext | undefined}*/ (getContext(PARAGLIDE_CONTEXT_KEY))
}
/**
 * @param {ParaglideContext} context
 */
export const setParaglideContext = (context) => {
	setContext(PARAGLIDE_CONTEXT_KEY, context)
}
