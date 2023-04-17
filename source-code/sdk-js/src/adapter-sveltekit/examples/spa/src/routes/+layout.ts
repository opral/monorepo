import { browser } from "$app/environment"
import { getRuntimeFromData, initRootLayoutLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/shared"
import type { LayoutLoad } from "./$types.js"
import { initLocalStorageDetector, navigatorDetector } from "@inlang/sdk-js/detectors/client"
import { localStorageKey } from '@inlang/sdk-js/adapter-sveltekit/client/reactive'

export const load = initRootLayoutLoadWrapper<LayoutLoad>({
	...(browser ? { initDetectors: () => [initLocalStorageDetector(localStorageKey), navigatorDetector] } : undefined),
}).wrap(async ({ data }) => {

	// const runtime = getRuntimeFromData(data)
	// console.info("+layout.ts", runtime.i("welcome"))

	return { ...data, "+layout.ts": Math.random() }
})
