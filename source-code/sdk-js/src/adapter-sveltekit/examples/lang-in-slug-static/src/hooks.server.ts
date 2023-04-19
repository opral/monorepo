import { initHandleWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"
import { serverFn } from "./utils/server.js"

export const handle = initHandleWrapper({
	getLanguage: ({ url }) => url.pathname.split("/")[1],
}).wrap(async ({ event, resolve }, { i }) => {
	console.info("--- new request", event.url.toString())

	console.info("hooks.server.ts", i("welcome"))

	serverFn(i)

	return resolve(event)
})
