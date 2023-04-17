import type * as Ast from "@inlang/core/ast"
import { getContext, setContext } from "svelte"
import { readonly, writable, type Readable } from "svelte/store"
import type { RelativeUrl } from '../../../../core/index.js'
import { inlangSymbol } from '../../shared/utils.js'
import type { SvelteKitClientRuntime } from '../index.js'
import type * as Runtime from '../../../../runtime/index.js'

// ------------------------------------------------------------------------------------------------

export const localStorageKey = "language"

// ------------------------------------------------------------------------------------------------

export type RuntimeContext<
	Language extends Ast.Language = Ast.Language,
	InlangFunction extends Runtime.InlangFunction = Runtime.InlangFunction,
> = {
	language: Readable<Language>
	referenceLanguage: Language
	languages: Language[]
	i: Readable<InlangFunction>
		switchLanguage: (language: Language) => Promise<void>
	loadResource: SvelteKitClientRuntime["loadResource"]
	route: (href: RelativeUrl) => RelativeUrl
}

export const getRuntimeFromContext = (): RuntimeContext => getContext(inlangSymbol)

export const addRuntimeToContext = (runtime: SvelteKitClientRuntime) => {
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

	setContext<RuntimeContext>(inlangSymbol, {
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
