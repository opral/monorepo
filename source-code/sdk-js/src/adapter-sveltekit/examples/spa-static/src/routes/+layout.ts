import { browser } from "$app/environment"
import { initRootLayoutLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/shared"
import { localStorageKey } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"
import type { LayoutLoad } from "./$types.js"
import { initLocalStorageDetector, navigatorDetector } from "@inlang/sdk-js/detectors/client"

export const prerender = true

export const load = initRootLayoutLoadWrapper<LayoutLoad>({
	initDetectors: browser ? () => [initLocalStorageDetector(localStorageKey), navigatorDetector] : undefined,
}).wrap(async ({ data }, { i }) => {
	console.info("+layout.ts", i("welcome"))

	return { ...data, "+layout.ts": Math.random() }
}) satisfies LayoutLoad
