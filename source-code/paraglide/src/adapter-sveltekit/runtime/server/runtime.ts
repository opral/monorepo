import type { LanguageTag } from "@inlang/sdk"
import { initRuntimeWithLanguageInformation } from "../../../runtime/index.js"
import { loadMessages } from "./state.js"

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
		loadMessages: (languageTag: LanguageTag) => loadMessages(languageTag),
		sourceLanguageTag,
		languageTags,
	})

	if (languageTag) {
		runtime.loadMessages(languageTag)
		runtime.changeLanguageTag(languageTag)
	}

	return runtime
}

// TODO: server should also expose a `route` function

export type SvelteKitServerRuntime = Awaited<ReturnType<typeof initSvelteKitServerRuntime>>
