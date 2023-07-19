import type { LoadEvent } from "@sveltejs/kit"
import { base } from "$app/paths"
import { initRuntimeWithLanguageInformation } from "../../../runtime/index.js"
import type { BCP47LanguageTag } from '@inlang/core/languageTag'

type InitSvelteKitClientRuntimeArgs = {
	fetch: LoadEvent["fetch"]
	sourceLanguageTag: BCP47LanguageTag
	languageTags: BCP47LanguageTag[]
	languageTag: BCP47LanguageTag | undefined
}

export const initSvelteKitClientRuntime = async ({
	fetch,
	languageTag,
	sourceLanguageTag,
	languageTags,
}: InitSvelteKitClientRuntimeArgs) => {
	const runtime = initRuntimeWithLanguageInformation({
		readResource: async (languageTag: BCP47LanguageTag) =>
			fetch(`${base}/inlang/${languageTag}.json`).then((response) =>
				response.ok ? response.json() : undefined,
			),
		sourceLanguageTag,
		languageTags,
	})

	if (languageTag) {
		await runtime.loadResource(languageTag)
		runtime.switchLanguage(languageTag)
	}

	return runtime
}

export type SvelteKitClientRuntime = Awaited<ReturnType<typeof initSvelteKitClientRuntime>>
