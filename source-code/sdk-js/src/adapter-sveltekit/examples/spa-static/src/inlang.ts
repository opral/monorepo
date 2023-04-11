import type { LoadEvent } from "@sveltejs/kit"
import { initRuntime, type InlangFunction } from "@inlang/sdk-js/runtime"
import { getContext, setContext } from "svelte"
import { derived, writable, type Readable } from "svelte/store"

// ------------------------------------------------------------------------------------------------

type InitI18nRuntimeArgs = {
	fetch: LoadEvent["fetch"]
	language: string
	referenceLanguage: string
	languages: string[]
}

export const initI18nRuntime = async ({
	fetch,
	language,
	referenceLanguage,
	languages,
}: InitI18nRuntimeArgs) => {
	const runtime = initRuntime({
		readResource: async (language: string) =>
			fetch(`/inlang/${language}.json`).then((response) =>
				response.ok ? response.json() : undefined,
			),
	})

	await runtime.loadResource(language)
	runtime.switchLanguage(language)

	return {
		...runtime,
		getLanguages: () => languages,
		getReferenceLanguage: () => referenceLanguage,
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

export const setI18nContext = (runtime: Runtime) => {
	const _language = writable(runtime.getLanguage() as string)
	const _i = writable(runtime.getInlangFunction())

	const switchLanguage = async (language: string) => {
		if (runtime.getLanguage() === language) return

		runtime.switchLanguage(language)

		_i.set(runtime.getInlangFunction())
		_language.set(language)

		localStorage.setItem("inlang-language", language)
	}

	setContext<I18nContext>(inlangSymbol, {
		language: derived(_language, (value) => value),
		languages: runtime.getLanguages(),
		i: derived(_i, (value) => value),
		loadResource: runtime.loadResource,
		switchLanguage,
	})
}

export const getI18nContext = (): I18nContext => getContext(inlangSymbol)
