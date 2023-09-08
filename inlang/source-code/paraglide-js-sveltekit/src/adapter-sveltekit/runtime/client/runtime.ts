import type { LoadEvent } from "@sveltejs/kit"
import { base } from "$app/paths"
import { initRuntimeWithLanguageInformation } from "../../../runtime/index.js"
import type { Message } from "@inlang/sdk"
import type { LanguageTag } from "@inlang/sdk"
import { browser } from "$app/environment"

type InitSvelteKitClientRuntimeArgs = {
	fetch: LoadEvent["fetch"]
	sourceLanguageTag: LanguageTag
	languageTags: LanguageTag[]
	languageTag: LanguageTag | undefined
	cache?: Record<LanguageTag, Message[] | undefined>
}

export const initSvelteKitClientRuntime = async ({
	fetch,
	languageTag,
	sourceLanguageTag,
	languageTags,
	cache = {},
}: InitSvelteKitClientRuntimeArgs) => {
	const runtime = initRuntimeWithLanguageInformation({
		loadMessages: async (languageTag: LanguageTag) => {
			if (!browser) cache = {} // disable the cache on the server
			return (cache[languageTag] ??= await fetch(`${base}/inlang/${languageTag}.json`).then(
				(response) => (response.ok ? (response.json() as Promise<Message[]>) : undefined),
			))
		},
		sourceLanguageTag,
		languageTags,
	})

	if (languageTag) {
		await runtime.loadMessages(languageTag)
		runtime.changeLanguageTag(languageTag)
	}

	return runtime
}

export type SvelteKitClientRuntime = Awaited<ReturnType<typeof initSvelteKitClientRuntime>>
