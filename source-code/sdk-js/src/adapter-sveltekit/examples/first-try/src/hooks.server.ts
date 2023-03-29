import type { Handle } from "@sveltejs/kit"
import { initConfig } from "@inlang/sdk-js/config"
import { initRuntime } from "@inlang/sdk-js/runtime"

export const handle = (async ({ event, resolve }) => {
	const config = await initConfig()
	const resources = await config?.readResources({ config })

	const runtime = initRuntime({
		// TODO: use `MaybePromise` and make loadResource sync/async aware
		readResource: async (language: string) =>
			resources?.find(({ languageTag: { name } }) => name === language),
	})

	const language = "de" // TODO: detect
	await runtime.loadResource(language)
	runtime.switchLanguage(language)
	const i = runtime.getLookupFunction()

	event.locals.i18n = {
		language,
		i,
	}

	console.log("hooks.server.ts", event.locals.i18n.i("welcome"))

	const response = await resolve(event)

	return response
}) satisfies Handle
