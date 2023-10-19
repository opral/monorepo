import { browser } from "$app/environment"
import { initRootLayoutLoadWrapper } from "@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared"
import type { LayoutLoad } from "./$types.js"
import {
	initLocalStorageDetector,
	navigatorDetector,
} from "@inlang/paraglide-js-sveltekit/detectors/client"

export const load = initRootLayoutLoadWrapper<LayoutLoad>({
	initDetectors: browser
		? () => [initLocalStorageDetector("languageTag"), navigatorDetector]
		: undefined,
}).use(async ({ data }, { i }) => {
	console.info("+layout.ts", i("welcome"))

	return { ...data, "+layout.ts": Math.random() }
})
