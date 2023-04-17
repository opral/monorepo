import type { Handle, ServerLoad, RequestEvent } from "@sveltejs/kit"
import type { RelativeUrl } from '../../../core/index.js'
import { detectLanguage } from '../../../detectors/detectLanguage.js'
import type { Detector } from '../../../detectors/index.js'
import { replaceLanguageInUrl } from '../shared/utils.js'
import type { DataPayload } from '../shared/wrappers.js'
import { initSvelteKitServerRuntime } from './runtime.js'
import { addRuntimeToLocals, getRuntimeFromLocals, languages, referenceLanguage } from './state.js'

// ------------------------------------------------------------------------------------------------

export const wrapHandle = (handle: Handle, initDetectors: (event: RequestEvent) => Detector[]) => async ({ event, resolve }: Parameters<Handle>[0]) => {
	const pathname = event.url.pathname as RelativeUrl
	if (pathname.startsWith("/inlang")) return resolve(event)

	const language = pathname.split("/")[1]
	if (!language || !languages.includes(language)) {
		const detectedLanguage = await detectLanguage(
			{ referenceLanguage, languages },
			...initDetectors(event)
		)

		return new Response(undefined, {
			status: 307,
			headers: { location: replaceLanguageInUrl(event.url, detectedLanguage).pathname }
		})
		// we can't use the `redirect` function in dev because we use two different SvelteKit instances
		// throw redirect(307, replaceLanguageInUrl(event.url, detectedLanguage).pathname)
	}

	const runtime = initSvelteKitServerRuntime({
		referenceLanguage,
		languages,
		language,
	})

	addRuntimeToLocals(event.locals, runtime)

	// TODO:
	// resolve(event, { transformPageChunk: ({ html }) => html.replace("%lang%", language) })

	return handle({ event, resolve })
}

// ------------------------------------------------------------------------------------------------

export const initRootServerLayoutLoadWrapper = <LayoutServerLoad extends ServerLoad<any, any, any, any>>() => ({
	wrap: <Data extends Record<string, any> | void>(load: (event: Parameters<LayoutServerLoad>[0]) =>
		Promise<Data> | Data) => async (event: Parameters<LayoutServerLoad>[0]): Promise<Data & DataPayload> => {
			const data = await load(event)

			const runtime = getRuntimeFromLocals(event.locals)

			return {
				...data,
				referenceLanguage: runtime.referenceLanguage, // TODO: only pass this if `referenceLanguage` gets used somewhere or detection strategy is on client
				languages: runtime.languages, // TODO: only pass this if `languages` get used somewhere
				language: runtime.language, // TODO: only pass this if `language` gets detected on server}
			}
		}
})
