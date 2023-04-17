import { browser } from "$app/environment"
import { initRootLayoutLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/shared"
import type { LayoutLoad } from "./$types.js"
import { initLocalStorageDetector, navigatorDetector } from "@inlang/sdk-js/detectors/client"
import { localStorageKey } from '@inlang/sdk-js/adapter-sveltekit/client/reactive'

export const load = initRootLayoutLoadWrapper<LayoutLoad>({
	initDetectors: browser ? () => [initLocalStorageDetector(localStorageKey), navigatorDetector] : undefined,
}).wrap(async ({ data }, runtime) => {
	console.info("+layout.ts", runtime.i("welcome"))

	return { ...data, "+layout.ts": Math.random() }
})
