import type { BCP47LanguageTag } from '@inlang/core/languageTag'
import { initRuntimeWithLanguageInformation } from "../../../runtime/index.js"
import { getResource } from "./index.js"

type InitSvelteKitServerRuntimeArgs = {
	sourceLanguageTag: BCP47LanguageTag
	languageTags: BCP47LanguageTag[]
	languageTag: BCP47LanguageTag | undefined
}

export const initSvelteKitServerRuntime = ({
	languageTag,
	sourceLanguageTag,
	languageTags,
}: InitSvelteKitServerRuntimeArgs) => {
	const runtime = initRuntimeWithLanguageInformation({
		readResource: (languageTag: BCP47LanguageTag) => getResource(languageTag),
		sourceLanguageTag,
		languageTags,
	})

	if (languageTag) {
		runtime.loadResource(languageTag)
		runtime.changeLanguageTag(languageTag)
	}

	return runtime
}

// TODO: server should also expose a `route` function

export type SvelteKitServerRuntime = Awaited<ReturnType<typeof initSvelteKitServerRuntime>>
