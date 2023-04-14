import { initRuntime } from '../../../runtime/index.js'
import { getResource } from './index.js'

type InitSvelteKitServerRuntimeArgs = {
	referenceLanguage: string
	languages: string[]
	language: string
}

// TODO: check if we need to pass those two args or if we can just import them here
export const initSvelteKitServerRuntime = ({
	language,
	referenceLanguage,
	languages,
}: InitSvelteKitServerRuntimeArgs) => {
	const runtime = initRuntime({
		readResource: (language: string) => getResource(language),
	})

	if (language) {
		// ! warning, this is currently async
		runtime.loadResource(language)
		runtime.switchLanguage(language)
	}

	return {
		...runtime,
		// TODO: move this into base runtime
		getReferenceLanguage: () => referenceLanguage,
		getLanguages: () => languages,
	}
}

// TODO: server should also expose a `route` function

export type SvelteKitServerRuntime = Awaited<ReturnType<typeof initSvelteKitServerRuntime>>
