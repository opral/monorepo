import type { InlangFunction } from "@inlang/sdk-js/runtime"
import { getContext, setContext } from "svelte"
import { readonly, writable, type Readable } from "svelte/store"
import { inlangSymbol, type RelativeUrl } from '../shared/index.js'
import type { Runtime } from '../client/index.js'

// ------------------------------------------------------------------------------------------------

export const localStorageKey = "language"

// ------------------------------------------------------------------------------------------------

export type I18nContext = {
	language: Readable<string>
	referenceLanguage: string
	languages: string[]
	i: Readable<InlangFunction>
	switchLanguage: (language: string) => Promise<void>
	loadResource: Runtime["loadResource"]
	route: (href: RelativeUrl) => RelativeUrl
}

export const getInlangContext = (): I18nContext => getContext(inlangSymbol)

export const setInlangContext = (runtime: Runtime) => {
	const _language = writable(runtime.getLanguage() as string)
	const _i = writable(runtime.getInlangFunction())

	const switchLanguage = async (language: string) => {
		if (runtime.getLanguage() === language) return

		// TODO: load Resource if not present

		runtime.switchLanguage(language)

		_i.set(runtime.getInlangFunction())
		_language.set(language)

		localStorage.setItem(localStorageKey, language)
	}

	setContext<I18nContext>(inlangSymbol, {
		language: readonly(_language),
		referenceLanguage: runtime.getReferenceLanguage(),
		languages: runtime.getLanguages(),
		i: readonly(_i),
		loadResource: runtime.loadResource,
		switchLanguage,
		route,
	})
}

// TODO: output warning that calling this does not make sense
const route = (href: RelativeUrl) => href
