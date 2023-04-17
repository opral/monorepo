import { initRootPageLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/client"
import { detectLanguage, navigatorDetector } from "@inlang/sdk-js/detectors"
import type { PageLoad } from "./$types.js"
import { browser } from "$app/environment"
import { redirect } from '@sveltejs/kit'

export const load = initRootPageLoadWrapper<PageLoad>({
	browser,
	redirectIfNeeded: async ({ parent }) => {
		// TODO: this is detection-strategy dependent
		const detectors = [navigatorDetector]

		const { referenceLanguage, languages } = await parent()

		const language = await detectLanguage(
			{ referenceLanguage, languages },
			...detectors
		)

		throw redirect(307, `/${language}`)
	}
}).wrap(async ({ parent }) => {
	if (browser) {
		// const data = await parent()
		// const i = getRuntimeFromData(data).i
		// console.info("+page.ts", i("welcome"))
	}
})
