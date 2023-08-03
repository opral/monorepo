import type { LoadEvent } from "@sveltejs/kit"
import { base } from "$app/paths"
import { initRuntimeWithLanguageInformation } from "../../../runtime/index.js"
import type { Resource } from "@inlang/core/ast"

type InitSvelteKitClientRuntimeArgs = {
	fetch: LoadEvent["fetch"]
	referenceLanguage: Language
	languages: Language[]
	language: Language | undefined
	cache?: Record<Language, Resource | undefined>
}

export const initSvelteKitClientRuntime = async ({
	fetch,
	language,
	referenceLanguage,
	languages,
	cache = {},
}: InitSvelteKitClientRuntimeArgs) => {
	const runtime = initRuntimeWithLanguageInformation({
		readResource: async (language: string) =>
			(cache[language] ??= await fetch(`${base}/inlang/${language}.json`).then((response) =>
				response.ok ? (response.json() as Promise<Resource>) : undefined,
			)),
		referenceLanguage,
		languages,
	})

	if (language) {
		await runtime.loadResource(language)
		runtime.switchLanguage(language)
	}

	return runtime
}

export type SvelteKitClientRuntime = Awaited<ReturnType<typeof initSvelteKitClientRuntime>>
