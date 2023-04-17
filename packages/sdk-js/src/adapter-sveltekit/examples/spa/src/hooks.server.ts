import type { Handle } from "@sveltejs/kit"
import {
	initSvelteKitServerRuntime,
	languages,
	referenceLanguage,
	addRuntimeToLocals,
} from "@inlang/sdk-js/adapter-sveltekit/server"

export const handle = (async ({ event, resolve }) => {
	console.info("--- new request", event.url.toString())

	// Note: if language is detected on the server, the inlang function should be passed to `locals`, else we can ignore it
	const language = undefined
	// const language = referenceLanguage

	const runtime = initSvelteKitServerRuntime({
		referenceLanguage,
		languages,
		language: language!,
	})

	// runtime.loadResource(language)
	// runtime.switchLanguage(language)

	addRuntimeToLocals(event.locals, runtime)

	return resolve(event)
}) satisfies Handle
