import { initRuntime, initRuntimeWithLanguageInformation } from '../../../runtime/index.js'
import { getResource } from './index.js'

type InitSvelteKitServerRuntimeArgs = {
	referenceLanguage: string
	languages: string[]
	language: string
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
		// ! warning, this is currently async
		runtime.loadResource(language)
		runtime.switchLanguage(language)
	}

	return runtime
}

// TODO: server should also expose a `route` function

export type SvelteKitServerRuntime = Awaited<ReturnType<typeof initSvelteKitServerRuntime>>
