import { browser } from "$app/environment"
import { initRootLayoutLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/shared"
import type { LayoutLoad } from "./$types.js"
import { initLocalStorageDetector, navigatorDetector } from "@inlang/sdk-js/detectors/client"

export const load = initRootLayoutLoadWrapper<LayoutLoad>({
	initDetectors: browser
		? () => [initLocalStorageDetector('language'), navigatorDetector]
		: undefined,
}).wrap(async ({ data }, { i }) => {
	console.info("+layout.ts", i("welcome"))

	return { ...data, "+layout.ts": Math.random() }
})
