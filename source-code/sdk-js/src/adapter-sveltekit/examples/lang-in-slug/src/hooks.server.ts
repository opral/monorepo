import {
	getRuntimeFromLocals, languages, referenceLanguage, initHandleWrapper
} from "@inlang/sdk-js/adapter-sveltekit/server"
import { serverFn } from "./utils/server.js"
import { detectLanguage, initAcceptLanguageHeaderDetector } from '@inlang/sdk-js/detectors'
import type { RelativeUrl } from '@inlang/sdk-js'
import { replaceLanguageInUrl } from '@inlang/sdk-js/adapter-sveltekit/shared'
import { redirect } from '@sveltejs/kit'

export const handle = initHandleWrapper({
	detectLanguage: async ({ request, url }) => {
		// TODO: this is detection-strategy dependent
		const detectors = [initAcceptLanguageHeaderDetector(request.headers)]

		const pathname = url.pathname as RelativeUrl
		const language = pathname.split("/")[1]
		if (!language || !languages.includes(language)) {
			const detectedLanguage = await detectLanguage(
				{ referenceLanguage, languages },
				...detectors,
			)

			throw redirect(307, replaceLanguageInUrl(url, detectedLanguage).pathname)
		}

		return language
	}
}).wrap(async ({ event, resolve }) => {
	console.info("--- new request", event.url.toString())

	const runtime = getRuntimeFromLocals(event.locals)

	console.info("hooks.server.ts", runtime.i("welcome"))

	serverFn(runtime.i)

	// TODO: do this in the wrapper function
	return resolve(event, { transformPageChunk: ({ html }) => html.replace("%lang%", runtime.language!) })
}
)
