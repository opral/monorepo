import { initRootPageLoadWrapper } from "@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared"
import { navigatorDetector } from "@inlang/paraglide-js-sveltekit/detectors/client"
import type { PageLoad } from "./$types.js"
import { browser } from "$app/environment"
import { redirect } from "@sveltejs/kit"
import { replaceLanguageInUrl } from "@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared"

export const load = initRootPageLoadWrapper<PageLoad>({
	browser,
	initDetectors: () => [navigatorDetector],
	redirect: {
		throwable: redirect,
		getPath: ({ url }, languageTag) => replaceLanguageInUrl(new URL(url), languageTag),
	},
}).use(async (_, { i }) => {
	console.info("+page.ts", i("welcome"))
})
