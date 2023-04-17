import type * as Ast from "@inlang/core/ast"
import { inlangSymbol } from "../../shared/utils.js"
import { replaceLanguageInUrl } from "../../shared/index.js"
import type { SvelteKitClientRuntime } from "../index.js"
import { goto } from "$app/navigation"
import { page } from "$app/stores"
import { get } from "svelte/store"
import { getContext, setContext } from "svelte"
import type * as Runtime from '../../../../runtime/index.js'
import type { RelativeUrl } from '../../../../core/index.js'
import type { Language } from '@inlang/core/ast'

type RuntimeContext<
	Language extends Ast.Language = Ast.Language,
	InlangFunction extends Runtime.InlangFunction = Runtime.InlangFunction,
> = {
	referenceLanguage: Language
	languages: Language[]
	language: Language
	i: InlangFunction
		switchLanguage: (language: Language) => Promise<void>
		loadResource: SvelteKitClientRuntime["loadResource"]
	route: (href: RelativeUrl) => RelativeUrl
}

export const getRuntimeFromContext = (): RuntimeContext => getContext(inlangSymbol)

export const addRuntimeToContext = (runtime: SvelteKitClientRuntime) => {
	const language = runtime.language as Language

	const switchLanguage = async (language: Language) => {
		if (runtime.language === language) return

		return goto(replaceLanguageInUrl(get(page).url, language), { invalidateAll: true })
	}

	setContext(inlangSymbol, {
		language,
		referenceLanguage: runtime.referenceLanguage,
		languages: runtime.languages,
		i: runtime.i,
		loadResource: runtime.loadResource,
		switchLanguage,
		route: route.bind(undefined, language),
	})
}

const route = (language: string, href: RelativeUrl) => {
	const url = `/${language}${href}`

	return (url.endsWith("/") ? url.slice(0, -1) : url) as RelativeUrl
}
