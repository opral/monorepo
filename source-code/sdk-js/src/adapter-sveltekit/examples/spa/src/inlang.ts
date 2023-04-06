import type { LoadEvent } from "@sveltejs/kit"
import { initRuntime, type InlangFunction } from "@inlang/sdk-js/runtime"
import { getContext, setContext } from "svelte"
import { derived, writable, type Readable } from "svelte/store"
import type { Resource } from "@inlang/core/ast"

// ------------------------------------------------------------------------------------------------

export const initI18nRuntime = async (fetch: LoadEvent["fetch"], language: string) => {
	const loadInlangData = <T>(url: string): Promise<T> =>
		fetch(`/inlang${url}`).then((response) => (response.ok ? response.json() : undefined))

	const runtime = initRuntime({
		readResource: async (language: string) => loadInlangData<Resource>(`/${language}.json`),
	})

	const [_, languages] = await Promise.all([
		runtime.loadResource(language),
		loadInlangData<string[]>("/languages.json"), // TODO: only load this if `languages` get used somewhere
	])

	localStorage.setItem("inlang-language", language)

	runtime.switchLanguage(language)

	return {
		...runtime,
		getLanguages: () => languages,
	}
}

// ------------------------------------------------------------------------------------------------

export const inlangSymbol = Symbol.for("inlang")

export type Runtime = Awaited<ReturnType<typeof initI18nRuntime>>

export type I18nContext = {
	language: Readable<string>
	languages: string[]
	i: Readable<InlangFunction>
	switchLanguage: (language: string) => Promise<void>
	loadResource: Runtime["loadResource"]
}

export const setI18nContext = (runtime: Runtime | undefined) => {
	if (!runtime) {
		const loadInlangData = <T>(url: string): Promise<T> =>
			fetch(`/inlang${url}`).then((response) => (response.ok ? response.json() : undefined))

		runtime = {
			...initRuntime({
				readResource: async (language: string) => loadInlangData<Resource>(`/${language}.json`),
			}),
			getLanguages: () => [],
		}
	}

	const _runtime = runtime
	const _language = writable(_runtime.getLanguage() as string)
	const _i = writable(_runtime.getInlangFunction())

	const switchLanguage = async (language: string) => {
		if (_runtime.getLanguage() === language) return

		_runtime.switchLanguage(language)

		_i.set(_runtime.getInlangFunction())
		_language.set(language)

		localStorage.setItem("inlang-language", language)
	}

	setContext<I18nContext>(inlangSymbol, {
		language: derived(_language, (value) => value),
		languages: _runtime.getLanguages(),
		i: derived(_i, (value) => value),
		loadResource: _runtime.loadResource,
		switchLanguage,
	})
}

export const getI18nContext = (): I18nContext => getContext(inlangSymbol)
