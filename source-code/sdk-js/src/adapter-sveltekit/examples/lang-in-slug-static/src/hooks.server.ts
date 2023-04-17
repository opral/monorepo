import {
	getRuntimeFromLocals,
	initHandleWrapper,
} from "@inlang/sdk-js/adapter-sveltekit/server"
import { serverFn } from "./utils/server.js"

export const handle = initHandleWrapper({
	getLanguage: ({ url }) => url.pathname.split("/")[1],
}).wrap(async ({ event, resolve }) => {
	console.info("--- new request", event.url.toString())

	const runtime = getRuntimeFromLocals(event.locals)

	console.info("hooks.server.ts", runtime.i("welcome"))

	serverFn(runtime.i)

	// TODO: do this in the wrapper function
	return resolve(event, { transformPageChunk: ({ html }) => html.replace("%lang%", runtime.language!) })
})
