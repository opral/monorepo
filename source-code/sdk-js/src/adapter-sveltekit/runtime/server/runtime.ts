import type { BCP47LanguageTag } from '@inlang/core/languageTag'
import { initRuntimeWithLanguageInformation } from "../../../runtime/index.js"
import { getResource } from "./index.js"

type InitSvelteKitServerRuntimeArgs = {
	referenceLanguage: BCP47LanguageTag
	languages: BCP47LanguageTag[]
	language: BCP47LanguageTag | undefined
}

export const initSvelteKitServerRuntime = ({
	language,
	referenceLanguage,
	languages,
}: InitSvelteKitServerRuntimeArgs) => {
	const runtime = initRuntimeWithLanguageInformation({
		readResource: (language: string) => getResource(language),
		referenceLanguage,
		languages,
	})

	if (language) {
		runtime.loadResource(language)
		runtime.switchLanguage(language)
	}

	return runtime
}

// TODO: server should also expose a `route` function

export type SvelteKitServerRuntime = Awaited<ReturnType<typeof initSvelteKitServerRuntime>>
