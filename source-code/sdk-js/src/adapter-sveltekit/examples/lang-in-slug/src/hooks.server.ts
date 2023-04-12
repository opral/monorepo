import { redirect, type Handle } from "@sveltejs/kit"
import { initRuntime } from "@inlang/sdk-js/runtime"
import { detectLanguage, initAcceptLanguageHeaderDetector } from "@inlang/sdk-js/detectors"
import {
	getResource,
	languages,
	referenceLanguage,
	setInlangInformationToLocals,
} from "./inlang.server.js"
import { serverFn } from "./utils/server.js"
import { replaceLanguageInUrl, type RelativeUrl } from './inlang.js'

export const handle = (async ({ event, resolve }) => {
	console.info("--- new request", event.url.toString())

	const pathname = event.url.pathname as RelativeUrl
	if (pathname.startsWith("/inlang")) return resolve(event)

	const language = pathname.split("/")[1]
	if (!language || !languages.includes(language)) {
		const detectedLanguage = await detectLanguage({ referenceLanguage, languages }, initAcceptLanguageHeaderDetector(event.request.headers))
		throw redirect(307, replaceLanguageInUrl(event.url, detectedLanguage).toString())
	}

	const runtime = initRuntime({
		readResource: (language: string) => getResource(language),
	})

	await runtime.loadResource(language)
	runtime.switchLanguage(language)
	const i = runtime.getInlangFunction()

	setInlangInformationToLocals(event.locals, {
		referenceLanguage,
		languages,
		language,
		i,
	})

	console.info("hooks.server.ts", i("welcome"))

	serverFn(i)

	return resolve(event, { transformPageChunk: ({ html }) => html.replace("%lang%", language) })
}) satisfies Handle
