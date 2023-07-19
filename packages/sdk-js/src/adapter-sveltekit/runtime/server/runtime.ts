import type { LanguageTag } from '@inlang/core/languageTag'
import { initRuntimeWithLanguageInformation } from "../../../runtime/index.js"
import { getResource } from "./index.js"

type InitSvelteKitServerRuntimeArgs = {
	sourceLanguageTag: LanguageTag
	languageTags: LanguageTag[]
	languageTag: LanguageTag | undefined
}

export const initSvelteKitServerRuntime = ({
	languageTag,
	sourceLanguageTag,
	languageTags,
}: InitSvelteKitServerRuntimeArgs) => {
	const runtime = initRuntimeWithLanguageInformation({
		readResource: (languageTag: LanguageTag) => getResource(languageTag),
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
