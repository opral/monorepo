import { initHandleWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"
import { serverFn } from "./utils/server.js"
import { initAcceptLanguageHeaderDetector } from "@inlang/sdk-js/detectors/server"
import { redirect } from "@sveltejs/kit"
import { replaceLanguageInUrl } from "@inlang/sdk-js/adapter-sveltekit/shared"

export const handle = initHandleWrapper({
	inlangConfigModule: import("../inlang.config.js"),
	parseLanguageTag: ({ url }) => url.pathname.split("/")[1],
	initDetectors: ({ request }) => [initAcceptLanguageHeaderDetector(request.headers)],
	redirect: {
		throwable: redirect,
		getPath: ({ url }, languageTag) => replaceLanguageInUrl(url, languageTag),
	},
}).use(async ({ event, resolve }, { i }) => {
	console.info("--- new request", event.url.toString())

	console.info("hooks.server.ts", i("welcome"))

	serverFn(i)

	return resolve(event)
})
