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
	LanguageTag extends BCP47LanguageTag = BCP47LanguageTag,
	InlangFunction extends Runtime.InlangFunction = Runtime.InlangFunction,
> = {
		sourceLanguageTag: LanguageTag
		languageTags: LanguageTag[]
		languageTag: LanguageTag
	i: InlangFunction
		switchLanguage: (languageTag: LanguageTag) => Promise<void>
	loadResource: SvelteKitClientRuntime["loadResource"]
	route: (href: RelativeUrl) => RelativeUrl
}

export const getRuntimeFromContext = () => getRuntimeFromContextShared() as RuntimeContext

export const addRuntimeToContext = (runtime: SvelteKitClientRuntime) => {
	const { languageTag, sourceLanguageTag, languageTags, i, loadResource } = runtime

	const switchLanguage = async (languageTag: BCP47LanguageTag) => {
		if (runtime.languageTag === languageTag) return

		return goto(replaceLanguageInUrl(get(page).url, languageTag), { invalidateAll: true })
	}

	setContext(inlangSymbol, {
		languageTag,
		sourceLanguageTag,
		languageTags,
		i,
		loadResource,
		switchLanguage,
		route: route.bind(undefined, languageTag as BCP47LanguageTag),
	})
}

const route = (languageTag: string, href: RelativeUrl) => {
	if (!href.startsWith("/")) return href as RelativeUrl

	const url = `/${languageTag}${href}`

	return (url.endsWith("/") ? url.slice(0, -1) : url) as RelativeUrl
}
