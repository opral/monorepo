import { setContext } from "svelte"
import { writable, type Readable } from "svelte/store"
import type { RelativeUrl } from "../../../../index.js"
import { inlangSymbol } from "../../shared/utils.js"
import type { SvelteKitClientRuntime } from "../index.js"
import { getRuntimeFromContext as getRuntimeFromContextShared } from "../shared/context.js"
import type * as Runtime from "../../../../runtime/index.js"
import type { BCP47LanguageTag } from '@inlang/core/languageTag'

// ------------------------------------------------------------------------------------------------

type RuntimeContext<
	LanguageTag extends BCP47LanguageTag = BCP47LanguageTag,
	InlangFunction extends Runtime.InlangFunction = Runtime.InlangFunction,
> = {
		languageTag: Readable<LanguageTag>
		sourceLanguageTag: LanguageTag
		languageTags: LanguageTag[]
	i: Readable<InlangFunction>
		switchLanguage: (languageTag: LanguageTag) => Promise<void>
	loadResource: SvelteKitClientRuntime["loadResource"]
	route: (href: RelativeUrl) => RelativeUrl
}

export const getRuntimeFromContext = () => getRuntimeFromContextShared() as RuntimeContext

export const addRuntimeToContext = (runtime: SvelteKitClientRuntime) => {
	const _language = writable(runtime.languageTag as BCP47LanguageTag)
	const _i = writable(runtime.i)

	const switchLanguage = async (languageTag: BCP47LanguageTag) => {
		if (runtime.languageTag === languageTag) return

		await runtime.loadResource(languageTag)

		runtime.switchLanguage(languageTag)

		_i.set(runtime.i)
		_language.set(languageTag)
	}

	setContext<RuntimeContext>(inlangSymbol, {
		languageTag: readonly(_language),
		sourceLanguageTag: runtime.sourceLanguageTag,
		languageTags: runtime.languageTags,
		i: readonly(_i),
		loadResource: runtime.loadResource,
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

// ------------------------------------------------------------------------------------------------

// copy from "svelte/store" to support older versions than `3.56.0`
function readonly<T>(store: Readable<T>): Readable<T> {
	return {
		// @ts-ignore
		subscribe: store.subscribe.bind(store),
	}
}
