// workaround for https://github.com/inlang/inlang/issues/1091
import { get } from "svelte/store"
import type { RelativeUrl } from "../../../../index.js"
import type { SvelteKitClientRuntime } from "../index.js"
import { getRuntimeFromContext as getRuntimeFromContextShared } from "../shared/context.js"
import type * as Runtime from "../../../../runtime/index.js"
import { goto } from "$app/navigation"
import { page } from "$app/stores"
import type { LanguageTag as LanguageTagBase } from "@inlang/app"
import { logDeprecation } from "../../../../utils.js"
import { inlangSymbol } from "../../shared/utils.js"
import { setContext } from "svelte"

// ------------------------------------------------------------------------------------------------

type RuntimeContext<
	LanguageTag extends LanguageTagBase = LanguageTagBase,
	InlangFunction extends Runtime.InlangFunction = Runtime.InlangFunction,
> = {
	sourceLanguageTag: LanguageTag
	languageTags: LanguageTag[]
	languageTag: LanguageTag
	i: InlangFunction
	changeLanguageTag: (languageTag: LanguageTag) => Promise<void>
	loadResource: SvelteKitClientRuntime["loadMessages"]
	route: (href: RelativeUrl) => RelativeUrl
	switchLanguage: (languageTag: LanguageTag) => Promise<void>
	referenceLanguage: LanguageTag
	language: LanguageTag
	languages: LanguageTag[]
}

export const getRuntimeFromContext = () => getRuntimeFromContextShared() as RuntimeContext

export const addRuntimeToContext = (runtime: SvelteKitClientRuntime) => {
	const {
		languageTag,
		sourceLanguageTag,
		languageTags,
		i,
		loadMessages: loadResource,
		referenceLanguage,
		language,
		languages,
	} = runtime

	const changeLanguageTag = async (languageTag: LanguageTagBase) => {
		if (runtime.languageTag === languageTag) return

		localStorage.setItem("languageTag", languageTag)

		return goto(get(page).url, { invalidateAll: true })
	}

	setContext<RuntimeContext>(inlangSymbol, {
		languageTag: languageTag!,
		sourceLanguageTag,
		languageTags,
		i,
		loadResource,
		changeLanguageTag,
		route,
		referenceLanguage,
		language: language!,
		languages,
		switchLanguage: (...args: Parameters<typeof changeLanguageTag>) => {
			logDeprecation("switchLanguage", "changeLanguageTag")
			return changeLanguageTag(...args)
		},
	})
}

const route = (href: RelativeUrl) => {
	if (import.meta.env.DEV) {
		console.info(
			`Calling the function 'route' is unnecessary with this project configuration, because it only returns the input.`,
		)
	}

	return href
}
