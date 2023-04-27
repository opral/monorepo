import type { Language } from "@inlang/core/ast"
import type * as Kit from "@sveltejs/kit"
import type { RelativeUrl } from "../../../core/index.js"
import { detectLanguage } from "../../../detectors/detectLanguage.js"
import type { Detector } from "../../../detectors/types.js"
import type { DataPayload } from "../shared/wrappers.js"
import { initSvelteKitServerRuntime, SvelteKitServerRuntime } from "./runtime.js"
import { addRuntimeToLocals, getRuntimeFromLocals, languages, referenceLanguage } from "./state.js"
import { sequence } from "@sveltejs/kit/hooks"

// ------------------------------------------------------------------------------------------------

type WrappedHandle = (
	input: Parameters<Kit.Handle>[0],
	runtime: SvelteKitServerRuntime,
) => ReturnType<Kit.Handle>

export const initHandleWrapper = (options: {
	getLanguage: (event: Kit.RequestEvent) => Language | undefined
	initDetectors?: (event: Kit.RequestEvent) => Detector[]
	redirect?: {
		throwable: typeof Kit.redirect
		getPath: (event: Kit.RequestEvent, language: Language) => URL | string
	}
}) => ({
	wrap: (handle: WrappedHandle) => {
		let runtime: SvelteKitServerRuntime

		return sequence(
			async ({ event, resolve }: Parameters<Kit.Handle>[0]) => {
				const pathname = event.url.pathname as RelativeUrl
				if (pathname.startsWith("/inlang")) return resolve(event)

				let language = options.getLanguage(event)
				if (!language || !languages.includes(language)) {
					if (options.redirect) {
						const detectedLanguage = await detectLanguage(
							{ referenceLanguage, languages },
							...(options.initDetectors ? options.initDetectors(event) : []),
						)

						throw options.redirect.throwable(
							307,
							options.redirect.getPath(event, detectedLanguage).toString(),
						)
					}

					language = undefined
				}

				runtime = initSvelteKitServerRuntime({
					referenceLanguage,
					languages,
					language: language!,
				})

				addRuntimeToLocals(event.locals, runtime)

				return resolve(event, {
					transformPageChunk: language
						? async ({ html }) => {
								return html.replace("<html", `<html lang="${language}"`)
						  }
						: undefined,
				})
			},
			(input) => (handle as WrappedHandle)(input, runtime),
		)
	},
})

// ------------------------------------------------------------------------------------------------

export const initRootServerLayoutLoadWrapper = <
	LayoutServerLoad extends Kit.ServerLoad<any, any, any, any>,
>() => ({
	wrap:
		<Data extends Record<string, any> | void>(
			load: (
				event: Parameters<LayoutServerLoad>[0],
				runtime: SvelteKitServerRuntime,
			) => Promise<Data> | Data,
		) =>
		async (event: Parameters<LayoutServerLoad>[0]): Promise<Data & DataPayload> => {
			const runtime = getRuntimeFromLocals(event.locals)

			return {
				...(await load(event, runtime)),
				referenceLanguage: runtime.referenceLanguage, // TODO: only pass this if `referenceLanguage` gets used somewhere or detection strategy is on client
				languages: runtime.languages, // TODO: only pass this if `languages` get used somewhere
				language: runtime.language, // TODO: only pass this if `language` gets detected on server
			}
		},
})

// ------------------------------------------------------------------------------------------------

export const initServerLoadWrapper = <ServerLoad extends Kit.ServerLoad<any, any, any, any>>() => ({
	wrap:
		<Data extends Record<string, any> | void>(
			load: (
				event: Parameters<ServerLoad>[0],
				runtime: SvelteKitServerRuntime,
			) => Promise<Data> | Data,
		) =>
		async (event: Parameters<ServerLoad>[0]): Promise<Data> => {
			const runtime = getRuntimeFromLocals(event.locals)

			return load(event, runtime)
		},
})
