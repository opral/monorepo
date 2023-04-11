import type { LoadEvent } from "@sveltejs/kit"
import { initRuntime, type InlangFunction } from "@inlang/sdk-js/runtime"
import { getContext, setContext } from "svelte"
import { goto } from "$app/navigation"
import { page } from "$app/stores"
import { get } from "svelte/store"

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

	if (language) {
		await runtime.loadResource(language)
		runtime.switchLanguage(language)
	}

	return {
		...runtime,
		getReferenceLanguage: () => referenceLanguage,
		getLanguages: () => languages,
	}
}

// ------------------------------------------------------------------------------------------------

export const inlangSymbol = Symbol.for("inlang")

type Runtime = Awaited<ReturnType<typeof initI18nRuntime>>

export type I18nContext = {
	language: string
	referenceLanguage: string
	languages: string[]
	i: InlangFunction
	switchLanguage: (language: string) => Promise<void>
	loadResource: Runtime["loadResource"]
	route: (href: RelativeUrl) => RelativeUrl
}

const replaceLanguageInUrl = (pathname: RelativeUrl, language: string) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_, __, ...path] = pathname.split("/")
	return `/${language}/${path.join("/")}`
}

export const setI18nContext = (runtime: Runtime) => {
	const language = runtime.getLanguage() as string

	const switchLanguage = (language: string) => {
		if (runtime.getLanguage() === language) return Promise.resolve()

		return goto(replaceLanguageInUrl(get(page).url.pathname as RelativeUrl, language))
	}

	setContext(inlangSymbol, {
		language,
		referenceLanguage: runtime.getReferenceLanguage(),
		languages: runtime.getLanguages(),
		i: runtime.getInlangFunction(),
		loadResource: runtime.loadResource,
		switchLanguage,
		route: route.bind(undefined, language),
	})
}

export const getI18nContext = (): I18nContext => getContext(inlangSymbol)

// ------------------------------------------------------------------------------------------------

type RelativeUrl = `/${string}`

export const route = (language: string, href: RelativeUrl) => {
	const url = `/${language}${href}`

	return (url.endsWith("/") ? url.slice(0, -1) : url) as RelativeUrl
}
