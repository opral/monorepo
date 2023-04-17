import {
	getRuntimeFromLocals,
	initHandleWrapper,
	languages,
} from "@inlang/sdk-js/adapter-sveltekit/server"
import type { RelativeUrl } from '@inlang/sdk-js'
import { serverFn } from "./utils/server.js"

export const handle = initHandleWrapper({
	detectLanguage: async ({ url }) => {
		const pathname = url.pathname as RelativeUrl

		const language = pathname.split("/")[1]

		return language && languages.includes(language) ? language : undefined
	}
}).wrap(async ({ event, resolve }) => {
	console.info("--- new request", event.url.toString())

	const runtime = getRuntimeFromLocals(event.locals)

	console.info("hooks.server.ts", runtime.i("welcome"))

	serverFn(runtime.i)

	// TODO: do this in the wrapper function
	return resolve(event, { transformPageChunk: ({ html }) => html.replace("%lang%", runtime.language!) })
})
