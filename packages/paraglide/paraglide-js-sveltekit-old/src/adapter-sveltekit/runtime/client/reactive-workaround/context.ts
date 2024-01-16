// workaround for https://github.com/opral/monorepo/issues/1091
import { get } from "svelte/store"
import type { RelativeUrl } from "../../../../index.js"
import type { SvelteKitClientRuntime } from "../index.js"
import { getRuntimeFromContext as getRuntimeFromContextShared } from "../shared/context.js"
import type * as Runtime from "../../../../runtime/index.js"
import { goto } from "$app/navigation"
import { page } from "$app/stores"
import type { LanguageTag as LanguageTagBase } from "@inlang/sdk"
import { logDeprecation } from "../../../../utils.js"
import { inlangSymbol } from "../../shared/utils.js"
import { setContext } from "svelte"

// ------------------------------------------------------------------------------------------------

type RuntimeContext<
	LanguageTag extends LanguageTagBase = LanguageTagBase,
	InlangFunction extends Runtime.InlangFunction = Runtime.InlangFunction
> = {
	sourceLanguageTag: LanguageTag
	languageTags: LanguageTag[]
	languageTag: LanguageTag
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

		localStorage.setItem("languageTag", languageTag)
		runtime.switchLanguage(languageTag)

		return goto(get(page).url, { invalidateAll: true, noScroll: true })
	}

	setContext<RuntimeContext>(inlangSymbol, {
		languageTag: languageTag!,
		sourceLanguageTag,
		languageTags,
		i,
		loadMessages,
		changeLanguageTag,
		route,
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
			logDeprecation("loadResource", "loadMessages")
			return runtime.loadResource(...args)
		},
	})
}

const route = (href: RelativeUrl) => {
	if (import.meta.env.DEV) {
		console.info(
			`Calling the function 'route' is unnecessary with this project configuration, because it only returns the input.`
		)
	}

	return href
}
