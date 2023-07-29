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
import type { Language } from "@inlang/core/ast"
import { goto } from "$app/navigation"
import { page } from "$app/stores"

// ------------------------------------------------------------------------------------------------

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

export const getRuntimeFromContext = () => getRuntimeFromContextShared() as RuntimeContext

export const addRuntimeToContext = (runtime: SvelteKitClientRuntime) => {
	const { language, referenceLanguage, languages, i, loadResource } = runtime

	const switchLanguage = async (language: Language) => {
		if (runtime.language === language) return

		localStorage.setItem("language", language)

		return goto(get(page).url, { invalidateAll: true })
	}

	addRuntimeToContextShared<RuntimeContext>({
		language: language!, // TODO: check
		referenceLanguage,
		languages,
		i,
		loadResource,
		switchLanguage,
		route,
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
