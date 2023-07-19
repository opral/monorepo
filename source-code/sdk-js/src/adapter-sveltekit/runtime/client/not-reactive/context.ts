import { inlangSymbol, replaceLanguageInUrl } from "../../shared/utils.js"
import type { SvelteKitClientRuntime } from "../runtime.js"
import { goto } from "$app/navigation"
import { page } from "$app/stores"
import { get } from "svelte/store"
import { setContext } from "svelte"
import type * as Runtime from "../../../../runtime/index.js"
import { getRuntimeFromContext as getRuntimeFromContextShared } from "../shared/context.js"
import type { RelativeUrl } from "../../../../types.js"
import type { BCP47LanguageTag } from '@inlang/core/languageTag'

type RuntimeContext<
	Language extends BCP47LanguageTag = BCP47LanguageTag,
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

export const getRuntimeFromContext = () => getRuntimeFromContextShared() as RuntimeContext

export const addRuntimeToContext = (runtime: SvelteKitClientRuntime) => {
	const { language, referenceLanguage, languages, i, loadResource } = runtime

	const switchLanguage = async (language: BCP47LanguageTag) => {
		if (runtime.language === language) return

		return goto(replaceLanguageInUrl(get(page).url, language), { invalidateAll: true })
	}

	setContext(inlangSymbol, {
		language,
		referenceLanguage,
		languages,
		i,
		loadResource,
		switchLanguage,
		route: route.bind(undefined, language as BCP47LanguageTag),
	})
}

const route = (language: string, href: RelativeUrl) => {
	if (!href.startsWith("/")) return href as RelativeUrl

	const url = `/${language}${href}`

	return (url.endsWith("/") ? url.slice(0, -1) : url) as RelativeUrl
}
