import { type RelativeUrl, replaceLanguageInUrl, inlangSymbol } from "../shared/index.js"
import type { Runtime } from "../client/index.js"
import { goto } from "$app/navigation"
import { page } from "$app/stores"
import { get } from "svelte/store"
import { getContext, setContext } from "svelte"
import type { InlangFunction } from '../../../runtime/index.js'

type InlangContext = {
	language: string
	referenceLanguage: string
	languages: string[]
	i: InlangFunction
	switchLanguage: (language: string) => Promise<void>
	loadResource: Runtime["loadResource"]
	route: (href: RelativeUrl) => RelativeUrl
}

export const getInlangContext = (): InlangContext => getContext(inlangSymbol)

export const setInlangContext = (runtime: Runtime) => {
	const language = runtime.getLanguage() as string

	const switchLanguage = async (language: string) => {
		if (runtime.getLanguage() === language) return

		return goto(replaceLanguageInUrl(get(page).url, language), { invalidateAll: true })
	}

	setContext(inlangSymbol, {
		language,
		referenceLanguage: runtime.getReferenceLanguage(),
		languages: runtime.getLanguages(),
		i: runtime.getInlangFunction(),
		loadResource: runtime.loadResource,
		switchLanguage,
		route: route.bind(undefined, language),
	})
}

const route = (language: string, href: RelativeUrl) => {
	const url = `/${language}${href}`

	return (url.endsWith("/") ? url.slice(0, -1) : url) as RelativeUrl
}
