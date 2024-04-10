import { languageTag } from "$paraglide/runtime"

export const ssr = false

export function load({ depends }) {
	depends("paraglide:lang")
	const lang = languageTag()
	return { lang }
}
