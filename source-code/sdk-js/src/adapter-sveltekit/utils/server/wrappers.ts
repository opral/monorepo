import type { Language } from '@inlang/core/ast'
import type { Handle, ServerLoad, RequestEvent } from "@sveltejs/kit"
import type { RelativeUrl } from '../../../core/index.js'
import type { DataPayload } from '../shared/wrappers.js'
import { initSvelteKitServerRuntime } from './runtime.js'
import { addRuntimeToLocals, getRuntimeFromLocals, languages, referenceLanguage } from './state.js'

// ------------------------------------------------------------------------------------------------

export const initHandleWrapper = (options: {
	detectLanguage: (event: RequestEvent) => Promise<Language | undefined | Response>
}) => ({
	wrap: (handle: Handle) => async ({ event, resolve }: Parameters<Handle>[0]) => {
		const pathname = event.url.pathname as RelativeUrl
		if (pathname.startsWith("/inlang")) return resolve(event)

		const language = await options.detectLanguage(event)
		if (language instanceof Response) return language

		const runtime = initSvelteKitServerRuntime({
			referenceLanguage,
			languages,
			language: language!,
		})

		addRuntimeToLocals(event.locals, runtime)

		// TODO:
		// resolve(event, { transformPageChunk: ({ html }) => html.replace("%lang%", language) })

		return handle({ event, resolve })
	}
})

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
