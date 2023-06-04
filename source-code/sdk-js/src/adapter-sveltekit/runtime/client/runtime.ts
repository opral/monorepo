import type { LoadEvent } from "@sveltejs/kit"
import { base } from "$app/paths"
import { initRuntimeWithLanguageInformation } from "../../../runtime/index.js"

type InitSvelteKitClientRuntimeArgs = {
	fetch: LoadEvent["fetch"]
	referenceLanguage: string
	languages: string[]
	language: string
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
