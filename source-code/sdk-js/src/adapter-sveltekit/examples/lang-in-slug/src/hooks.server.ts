import type { Handle } from "@sveltejs/kit"
import {
	getRuntimeFromLocals,
} from "@inlang/sdk-js/adapter-sveltekit/server"
import { serverFn } from "./utils/server.js"
import { wrapHandle } from '@inlang/sdk-js/adapter-sveltekit/server'
import { language } from '../../../../../dist/core/index.js'
import { initAcceptLanguageHeaderDetector } from '../../../../../dist/detectors/index.js'

export const handle = wrapHandle(
	async ({ event, resolve }) => {
		console.info("--- new request", event.url.toString())

		const runtime = getRuntimeFromLocals(event.locals)

		console.info("hooks.server.ts", runtime.i("welcome"))

		serverFn(runtime.i)

		// TODO: do this in the wrapper function
		return resolve(event, { transformPageChunk: ({ html }) => html.replace("%lang%", language) })
	},
	({ request }) => [initAcceptLanguageHeaderDetector(request.headers)]
) satisfies Handle
