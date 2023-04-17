import type { Handle } from "@sveltejs/kit"
import {
	initSvelteKitServerRuntime,
	languages,
	referenceLanguage,
	addRuntimeToLocals,
} from "@inlang/sdk-js/adapter-sveltekit/server"
import { serverFn } from "./utils/server.js"

export const handle = (async ({ event, resolve }) => {
	console.info("--- new request", event.url.toString())

	const pathname = event.url.pathname
	if (pathname.startsWith("/inlang")) return resolve(event)

	const language = pathname.split("/")[1] || (undefined as unknown as string)

	const runtime = await initSvelteKitServerRuntime({
		referenceLanguage,
		languages,
		language,
	})

	addRuntimeToLocals(event.locals, runtime)

	console.info("hooks.server.ts", runtime.i("welcome"))

	serverFn(runtime.i)

	return resolve(event, { transformPageChunk: ({ html }) => html.replace("%lang%", language) })
}) satisfies Handle
