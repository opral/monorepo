import { getContext, setContext } from "svelte"
import { PARAGLIDE_CONTEXT_KEY } from "../../constants.js"

interface ParaglideContext {
	translateHref: (href: string, hreflang?: string) => string
}

export const getParaglideContext = () => {
	return getContext(PARAGLIDE_CONTEXT_KEY) as ParaglideContext | undefined
}
export const setParaglideContext = (context: ParaglideContext) => {
	setContext(PARAGLIDE_CONTEXT_KEY, context)
}
