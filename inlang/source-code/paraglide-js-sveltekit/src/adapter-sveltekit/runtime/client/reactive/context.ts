import { writable, type Readable } from "svelte/store"
import type { RelativeUrl } from "../../../../index.js"
import type { SvelteKitClientRuntime } from "../index.js"
import { getRuntimeFromContext as getRuntimeFromContextShared } from "../shared/context.js"
import type * as Runtime from "../../../../runtime/index.js"
import type { LanguageTag as LanguageTagBase } from "@inlang/sdk"
import { logDeprecation } from "../../../../utils.js"
import { inlangSymbol } from "../../shared/utils.js"
import { setContext } from "svelte"

// ------------------------------------------------------------------------------------------------

type RuntimeContext<
	LanguageTag extends LanguageTagBase = LanguageTagBase,
	InlangFunction extends Runtime.InlangFunction = Runtime.InlangFunction,
> = {
	languageTag: Readable<LanguageTag>
	sourceLanguageTag: LanguageTag
	languageTags: LanguageTag[]
	i: Readable<InlangFunction>
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
	const _language = writable(runtime.languageTag as LanguageTagBase)
	const _i = writable(runtime.i)

	const changeLanguageTag = async (languageTag: LanguageTagBase) => {
		if (runtime.languageTag === languageTag) return

		await runtime.loadMessages(languageTag)

		runtime.changeLanguageTag(languageTag)

		_i.set(runtime.i)
		_language.set(languageTag)
	}

	setContext<RuntimeContext>(inlangSymbol, {
		languageTag: readonly(_language),
		sourceLanguageTag: runtime.sourceLanguageTag,
		languageTags: runtime.languageTags,
		i: readonly(_i),
		loadMessages: runtime.loadMessages,
		changeLanguageTag,
		route,
		get referenceLanguage() {
			return runtime.referenceLanguage
		},
		get languages() {
			return runtime.languages
		},
		get language() {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
