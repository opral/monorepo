import type { LoadEvent } from "@sveltejs/kit"
import { base } from "$app/paths"
import { initRuntimeWithLanguageInformation } from "../../../runtime/index.js"
import type { BCP47LanguageTag } from '@inlang/core/languageTag'

type InitSvelteKitClientRuntimeArgs = {
	fetch: LoadEvent["fetch"]
	referenceLanguage: BCP47LanguageTag
	languages: BCP47LanguageTag[]
	language: BCP47LanguageTag | undefined
}

export const initSvelteKitClientRuntime = async ({
	fetch,
	language,
	referenceLanguage,
	languages,
}: InitSvelteKitClientRuntimeArgs) => {
	const runtime = initRuntimeWithLanguageInformation({
		readResource: async (language: string) =>
			fetch(`${base}/inlang/${language}.json`).then((response) =>
				response.ok ? response.json() : undefined,
			),
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
