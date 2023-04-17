import { redirect, type Handle } from "@sveltejs/kit"
import { detectLanguage, initAcceptLanguageHeaderDetector } from "@inlang/sdk-js/detectors"
import {
	languages,
	referenceLanguage,
	addRuntimeToLocals,
} from "@inlang/sdk-js/adapter-sveltekit/server"
import { serverFn } from "./utils/server.js"
import { replaceLanguageInUrl } from "@inlang/sdk-js/adapter-sveltekit/shared"
import type { RelativeUrl } from "@inlang/sdk-js"
import { initSvelteKitServerRuntime } from "@inlang/sdk-js/adapter-sveltekit/server"

export const handle = (async ({ event, resolve }) => {
	console.info("--- new request", event.url.toString())

	const pathname = event.url.pathname as RelativeUrl
	if (pathname.startsWith("/inlang")) return resolve(event)

	const language = pathname.split("/")[1]
	if (!language || !languages.includes(language)) {
		const detectedLanguage = await detectLanguage(
			{ referenceLanguage, languages },
			initAcceptLanguageHeaderDetector(event.request.headers),
		)
		throw redirect(307, replaceLanguageInUrl(event.url, detectedLanguage).toString())
	}

	const runtime = initSvelteKitServerRuntime({
		referenceLanguage,
		languages,
		language,
	})

	addRuntimeToLocals(event.locals, runtime)

	console.info("hooks.server.ts", runtime.i("welcome"))

	serverFn(runtime.i)

	return resolve(event, { transformPageChunk: ({ html }) => html.replace("%lang%", language) })
}) satisfies Handle
