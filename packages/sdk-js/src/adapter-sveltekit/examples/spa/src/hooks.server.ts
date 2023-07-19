import { initHandleWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"

export const handle = initHandleWrapper({
	inlangConfigModule: import("../inlang.config.js"),
	parseLanguageTag: () => undefined,
}).use(async ({ event, resolve }) => {
	console.info("--- new request", event.url.toString())

	return resolve(event)
})
