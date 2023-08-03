import type { LoadEvent } from "@sveltejs/kit"
import { base } from "$app/paths"
import { initRuntimeWithLanguageInformation } from "../../../runtime/index.js"
import type { Resource } from "@inlang/core/ast"
import type { LanguageTag } from "@inlang/core/languageTag"

type InitSvelteKitClientRuntimeArgs = {
	fetch: LoadEvent["fetch"]
	sourceLanguageTag: LanguageTag
	languageTags: LanguageTag[]
	languageTag: LanguageTag | undefined
	cache?: Record<Language, Resource | undefined>
}

export const initSvelteKitClientRuntime = async ({
	fetch,
	languageTag,
	sourceLanguageTag,
	languageTags,
	cache = {},
}: InitSvelteKitClientRuntimeArgs) => {
	const runtime = initRuntimeWithLanguageInformation({
		readResource: async (languageTag: LanguageTag) =>
			(cache[languageTag] ??= await fetch(`${base}/inlang/${languageTag}.json`).then((response) =>
				response.ok ? (response.json() as Promise<Resource>) : undefined,
			)),
		sourceLanguageTag,
		languageTags,
	})

	if (languageTag) {
		await runtime.loadResource(languageTag)
		runtime.changeLanguageTag(languageTag)
	}

	return runtime
}

export type SvelteKitClientRuntime = Awaited<ReturnType<typeof initSvelteKitClientRuntime>>
