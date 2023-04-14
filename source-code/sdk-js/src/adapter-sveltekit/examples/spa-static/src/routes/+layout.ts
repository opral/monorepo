import { browser } from "$app/environment"
import { setRuntimeToData } from "@inlang/sdk-js/adapter-sveltekit/shared"
import { initSvelteKitClientRuntime } from "@inlang/sdk-js/adapter-sveltekit/client"
import { localStorageKey } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"
import type { LayoutLoad } from "./$types.js"
import {
	detectLanguage,
	initLocalStorageDetector,
	navigatorDetector,
} from "@inlang/sdk-js/detectors"

export const prerender = true

export const load = (async ({ fetch, data }) => {
	let language: string | undefined = undefined

	if (browser) {
		language = await detectLanguage(
			{ referenceLanguage: data.referenceLanguage, languages: data.languages },
			initLocalStorageDetector(localStorageKey),
			navigatorDetector,
		)
	}

	browser && localStorage.setItem(localStorageKey, language as string)

	const runtime = await initSvelteKitClientRuntime({
		fetch,
		language: language as string,
		referenceLanguage: data.referenceLanguage,
		languages: data.languages,
	})

	if (browser) {
		const i = runtime.getInlangFunction()

		console.info("+layout.ts", i("welcome"))
	}

	return setRuntimeToData({ ...data, "+layout.ts": Math.random() }, runtime)
}) satisfies LayoutLoad
