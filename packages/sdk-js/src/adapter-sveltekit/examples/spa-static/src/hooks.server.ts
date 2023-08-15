import { initHandleWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"

export const handle = initHandleWrapper({
	parseLanguageTag: () => undefined,
}).use(async ({ event, resolve }) => {
	console.info("--- new request", event.url.toString())

	return resolve(event)
})
