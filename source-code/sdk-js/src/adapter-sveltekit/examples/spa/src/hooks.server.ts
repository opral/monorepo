import type { Handle } from "@sveltejs/kit"
import { initRuntime } from "@inlang/sdk-js/runtime"
import {
	getResource,
	languages,
	referenceLanguage,
	setInlangInformationToLocals,
} from "@inlang/sdk-js/adapter-sveltekit/server"

export const handle = (async ({ event, resolve }) => {
	console.info("--- new request", event.url.toString())

	// Note: if language is detected on the server, the inlang function should be passed to `locals`, else we can ignore it
	const language = undefined as unknown as string // referenceLanguage
	// const language = referenceLanguage

	const runtime = initRuntime({
		readResource: (language: string) => getResource(language),
	})

	// TODO: don't set props if they are never used
	// await runtime.loadResource(language)
	// runtime.switchLanguage(language)
	const i = runtime.getInlangFunction()

	setInlangInformationToLocals(event.locals, {
		referenceLanguage,
		languages,
		language,
		i,
	})

	return resolve(event)
}) satisfies Handle
