import { initHandleWrapper } from "@inlang/paraglide-js-sveltekit/adapter-sveltekit/server"

export const handle = initHandleWrapper({
	parseLanguageTag: () => undefined,
}).use(async ({ event, resolve }) => {
	console.info("--- new request", event.url.toString())

	return resolve(event)
})
