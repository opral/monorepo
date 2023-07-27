import { replaceLanguageInUrl } from "../../shared/utils.js"
import type { SvelteKitClientRuntime } from "../runtime.js"
import { goto } from "$app/navigation"
import { page } from "$app/stores"
import { get } from "svelte/store"
import type * as Runtime from "../../../../runtime/index.js"
import {
	getRuntimeFromContext as getRuntimeFromContextShared,
	addRuntimeToContext as addRuntimeToContextShared,
} from "../shared/context.js"
import type { RelativeUrl } from "../../../../types.js"
import type { LanguageTag } from '@inlang/core/languageTag'
import { logDeprecation } from '../../../../utils.js'

type RuntimeContext<
	LanguageTag extends LanguageTag = LanguageTag,
	InlangFunction extends Runtime.InlangFunction = Runtime.InlangFunction,
> = {
		sourceLanguageTag: LanguageTag
		languageTag: LanguageTag
		languageTags: LanguageTag[]
	i: InlangFunction
		changeLanguageTag: (languageTag: LanguageTag) => Promise<void>
		loadResource: SvelteKitClientRuntime["loadResource"]
		route: (href: RelativeUrl) => RelativeUrl
		switchLanguage: (languageTag: LanguageTag) => Promise<void>
		referenceLanguage: LanguageTag
		language: LanguageTag
		languages: LanguageTag[]
}

export const getRuntimeFromContext = () => getRuntimeFromContextShared() as RuntimeContext

export const addRuntimeToContext = (runtime: SvelteKitClientRuntime) => {
	const { languageTag, sourceLanguageTag, languageTags, i, loadResource, referenceLanguage, language, languages } = runtime

	const changeLanguageTag = async (languageTag: LanguageTag) => {
		if (runtime.languageTag === languageTag) return

		return goto(replaceLanguageInUrl(get(page).url, languageTag), { invalidateAll: true })
	}

	setContext<RuntimeContext>(inlangSymbol, {
		sourceLanguageTag,
		languageTag: languageTag!,
		languageTags,
		i,
		loadResource,
		changeLanguageTag,
		route: route.bind(undefined, languageTag as LanguageTag),
		referenceLanguage,
		language: language!,
		languages,
		switchLanguage: (...args: Parameters<typeof changeLanguageTag>) => {
			logDeprecation('switchLanguage', 'changeLanguageTag')
			return changeLanguageTag(...args)
		},
	})
}

const route = (languageTag: LanguageTag, href: RelativeUrl) => {
	if (!href.startsWith("/")) return href as RelativeUrl

	const url = `/${languageTag}${href}`

	return (url.endsWith("/") ? url.slice(0, -1) : url) as RelativeUrl
}
