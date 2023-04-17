import { initHandleWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"
import { serverFn } from "./utils/server.js"

export const handle = initHandleWrapper({
	getLanguage: ({ url }) => url.pathname.split("/")[1],
}).wrap(async ({ event, resolve }, { i, language }) => {
	console.info("--- new request", event.url.toString())

	console.info("hooks.server.ts", i("welcome"))

	serverFn(i)

	// TODO: do this in the wrapper function
	return resolve(event, { transformPageChunk: ({ html }) => html.replace("%lang%", language!) })
})
