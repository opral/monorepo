// workaround for https://github.com/inlang/inlang/issues/1091
import type * as Ast from "@inlang/core/ast"
import { get } from "svelte/store"
import type { RelativeUrl } from "../../../../index.js"
import type { SvelteKitClientRuntime } from "../index.js"
import {
	getRuntimeFromContext as getRuntimeFromContextShared,
	addRuntimeToContext as addRuntimeToContextShared,
} from "../shared/context.js"
import type * as Runtime from "../../../../runtime/index.js"
import { goto } from "$app/navigation"
import { page } from "$app/stores"
import type { LanguageTag } from '@inlang/core/languageTag'
import { logDeprecation } from '../../../../utils.js'

// ------------------------------------------------------------------------------------------------

type RuntimeContext<
	LanguageTag extends LanguageTag = LanguageTag,
	InlangFunction extends Runtime.InlangFunction = Runtime.InlangFunction,
> = {
		sourceLanguageTag: LanguageTag
		languageTags: LanguageTag[]
		languageTag: LanguageTag
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
			logDeprecation('switchLanguage', 'changeLanguageTag')
			return changeLanguageTag(...args)
		},
	})
}

// TODO: output warning during dev that calling this does not make sense
const route = (href: RelativeUrl) => {
	if (import.meta.env.DEV) {
		console.info(
			`Calling the function 'route' is unnecessary with this project configuration, because it only returns the input.`,
		)
	}

	return href
}
