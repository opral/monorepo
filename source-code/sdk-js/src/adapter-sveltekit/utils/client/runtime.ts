import type { LoadEvent } from "@sveltejs/kit"
import { initRuntime } from '../../../runtime/index.js'

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
		// TODO: move this into base runtime
		getReferenceLanguage: () => referenceLanguage,
		getLanguages: () => languages,
	}
}

export type SvelteKitClientRuntime = Awaited<ReturnType<typeof initSvelteKitClientRuntime>>
