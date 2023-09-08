import { inlangSymbol, replaceLanguageInUrl } from "../../shared/utils.js"
import type { SvelteKitClientRuntime } from "../runtime.js"
import { goto } from "$app/navigation"
import { page } from "$app/stores"
import { get } from "svelte/store"
import type * as Runtime from "../../../../runtime/index.js"
import { getRuntimeFromContext as getRuntimeFromContextShared } from "../shared/context.js"
import type { RelativeUrl } from "../../../../types.js"
import type { LanguageTag as LanguageTagBase } from "@inlang/sdk"
import { logDeprecation } from "../../../../utils.js"
import { setContext } from "svelte"

type RuntimeContext<
	LanguageTag extends LanguageTagBase = LanguageTagBase,
	InlangFunction extends Runtime.InlangFunction = Runtime.InlangFunction,
> = {
	sourceLanguageTag: LanguageTag
	languageTag: LanguageTag
	languageTags: LanguageTag[]
	i: InlangFunction
	changeLanguageTag: (languageTag: LanguageTag) => Promise<void>
	loadMessages: SvelteKitClientRuntime["loadMessages"]
	route: (href: RelativeUrl) => RelativeUrl
	/** @deprecated Use `changeLanguageTag` instead. */
	switchLanguage: (languageTag: LanguageTag) => Promise<void>
	/** @deprecated Use `loadMessages` instead. */
	loadResource: SvelteKitClientRuntime["loadMessages"]
	/** @deprecated Use `sourceLanguageTag` instead. */
	referenceLanguage: LanguageTag
	/** @deprecated Use `languageTag` instead. */
	language: LanguageTag
	/** @deprecated Use `languageTags` instead. */
	languages: LanguageTag[]
}

export const getRuntimeFromContext = () => getRuntimeFromContextShared() as RuntimeContext

export const addRuntimeToContext = (runtime: SvelteKitClientRuntime) => {
	const { languageTag, sourceLanguageTag, languageTags, i, loadMessages } = runtime

	const changeLanguageTag = async (languageTag: LanguageTagBase) => {
		if (runtime.languageTag === languageTag) return

		return goto(replaceLanguageInUrl(get(page).url, languageTag), { invalidateAll: true })
	}

	setContext<RuntimeContext>(inlangSymbol, {
		sourceLanguageTag,
		languageTag: languageTag!,
		languageTags,
		i,
		loadMessages,
		changeLanguageTag,
		route: route.bind(undefined, languageTag as LanguageTagBase),
		get referenceLanguage() {
			return runtime.referenceLanguage
		},
		get languages() {
			return runtime.languages
		},
		get language() {
			return runtime.language!
		},
		switchLanguage: (...args: Parameters<typeof changeLanguageTag>) => {
			logDeprecation("switchLanguage", "changeLanguageTag")
			return changeLanguageTag(...args)
		},
		loadResource: (...args: Parameters<typeof runtime.loadResource>) => {
			logDeprecation("loadResources", "loadMessages")
			return runtime.loadResource(...args)
		},
	})
}

const route = (languageTag: LanguageTagBase, href: RelativeUrl) => {
	if (!href.startsWith("/")) return href as RelativeUrl

	const url = `/${languageTag}${href}`

	return (url.endsWith("/") ? url.slice(0, -1) : url) as RelativeUrl
}
