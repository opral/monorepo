import { redirect, type Handle } from "@sveltejs/kit"
import { initRuntime } from "@inlang/sdk-js/runtime"
import { getResource, languages } from "./inlang.server"
import { serverFn } from "./utils/server"

export const handle = (async ({ event, resolve }) => {
	console.info("--- new request", event.url.toString())

	const pathname = event.url.pathname
	if (pathname.startsWith("/inlang")) return resolve(event)

	const language = pathname.split("/")[1]
	if (!language || !languages.includes(language)) {
		// TODO: detect preferred language
		throw redirect(307, "/en")
	}

	const runtime = initRuntime({
		readResource: (language: string) => getResource(language),
	})

	await runtime.loadResource(language)
	runtime.switchLanguage(language)
	const i = runtime.getLookupFunction()

	event.locals.i18n = {
		language,
		i,
	}

	console.info("hooks.server.ts", event.locals.i18n.i("welcome"))

	serverFn(i)

	return resolve(event, { transformPageChunk: ({ html }) => html.replace("%lang%", language) })
}) satisfies Handle
