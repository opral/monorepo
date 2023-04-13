import type { LoadEvent } from "@sveltejs/kit"
import { initRuntime } from '../../../runtime/index.js'

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

export type Runtime = Awaited<ReturnType<typeof initI18nRuntime>>