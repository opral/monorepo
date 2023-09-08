import { initHandleWrapper } from "@inlang/paraglide-js-sveltekit/adapter-sveltekit/server"
import { serverFn } from "./utils/server.js"

export const handle = initHandleWrapper({
	parseLanguageTag: ({ url }) => url.pathname.split("/")[1],
}).use(async ({ event, resolve }, { i }) => {
	console.info("--- new request", event.url.toString())

	console.info("hooks.server.ts", i("welcome"))

	serverFn(i)

	return resolve(event)
})
