import { browser } from "$app/environment"
import { setInlangPayload } from "@inlang/sdk-js/adapter-sveltekit/shared"
import { initI18nRuntime } from "@inlang/sdk-js/adapter-sveltekit/client"
import { localStorageKey } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"
import type { LayoutLoad } from "./$types.js"
import {
	detectLanguage,
	initLocalStorageDetector,
	navigatorDetector,
} from "@inlang/sdk-js/detectors"

export const load = (async ({ fetch, data }) => {
	let language = data.language

	if (browser && !language) {
		// Note: SPA (non-static) could also detect the language on the server
		language = await detectLanguage(
			{ referenceLanguage: data.referenceLanguage, languages: data.languages },
			initLocalStorageDetector(localStorageKey),
			navigatorDetector,
		)
	}

	browser && localStorage.setItem(localStorageKey, language)


	const runtime = await initI18nRuntime({
		fetch,
		language,
		referenceLanguage: data.referenceLanguage,
		languages: data.languages,
	})

	const i = runtime.getInlangFunction()

	console.info("+layout.ts", i("welcome"))

	return { ...(data || {}), "+layout.ts": Math.random(), ...setInlangPayload(runtime) }
}) satisfies LayoutLoad
