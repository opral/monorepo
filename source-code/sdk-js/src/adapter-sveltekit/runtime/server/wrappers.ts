import type { Language } from "@inlang/core/ast"
import type * as Kit from "@sveltejs/kit"
import type { RelativeUrl } from "../../../index.js"
import { detectLanguage } from "../../../detectors/detectLanguage.js"
import type { Detector } from "../../../detectors/types.js"
import type { DataPayload } from "../shared/wrappers.js"
import { initSvelteKitServerRuntime, type SvelteKitServerRuntime } from "./runtime.js"
import { addRuntimeToLocals, getRuntimeFromLocals, initState } from "./state.js"
import { sequence } from "@sveltejs/kit/hooks"
import type { InlangConfigModule } from "@inlang/core/config"

// ------------------------------------------------------------------------------------------------

type WrappedHandle = (
	input: Parameters<Kit.Handle>[0],
	runtime: SvelteKitServerRuntime,
) => ReturnType<Kit.Handle>

type HandleOptions = {
	inlangConfigModule: Promise<InlangConfigModule>
	getLanguage: (event: Kit.RequestEvent) => Language | undefined
	initDetectors?: (event: Kit.RequestEvent) => Detector[]
	redirect?: {
		throwable: typeof Kit.redirect
		getPath: (event: Kit.RequestEvent, language: Language) => URL | string
	}
	excludedRoutes?: RelativeUrl[]
}

export const initHandleWrapper = (options: HandleOptions) => ({
	use: (handle: WrappedHandle) => {
		let runtime: SvelteKitServerRuntime

		const excludedRoutes = [
			"/inlang", // inlang internal route
			"/[fallback]", // SvelteKit internal fallback route
			...(options.excludedRoutes || []) // user defined excluded routes
		]

		return sequence(
			async ({ event, resolve }: Parameters<Kit.Handle>[0]) => {
				const pathname = event.url.pathname as RelativeUrl

				runtime = getRuntimeFromLocals(event.locals)
				if (runtime) {
					// runtime was already added by a previous wrapper
					return resolve(event)
				}

				if (excludedRoutes.some((route) => pathname.startsWith(route))) {
					return resolve(event)
				}

				const { referenceLanguage, languages } = await initState(await options.inlangConfigModule)

				let language = options.getLanguage(event)
				// TODO: create `isLanguage` helper function
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
					language,
				})

				addRuntimeToLocals(event.locals, runtime)

				return resolve(event, {
					transformPageChunk: language
						? async ({ html }) => html.replace("<html", `<html lang="${language}"`)
						: undefined,
				})
			},
			(input) => (handle as WrappedHandle)(input, runtime),
		)
	},
})

// ------------------------------------------------------------------------------------------------

export const initRootLayoutServerLoadWrapper = <
	LayoutServerLoad extends Kit.ServerLoad<any, any, any, any>,
>() => ({
	use:
		<Data extends Record<string, any> | void>(
			load: (
				event: Parameters<LayoutServerLoad>[0],
				runtime: SvelteKitServerRuntime,
			) => Promise<Data> | Data,
		) =>
			async (event: Parameters<LayoutServerLoad>[0]): Promise<Data & DataPayload> => {
				const runtime = getRuntimeFromLocals(event.locals)

				// TODO: only insert if language detection strategy url is used
				event.params.lang

				return {
					...(await load(event, runtime)),
					"[inlang]": {
						referenceLanguage: runtime?.referenceLanguage, // TODO: only pass this if `referenceLanguage` gets used somewhere or detection strategy is on client
						languages: runtime?.languages, // TODO: only pass this if `languages` get used somewhere
						language: runtime?.language, // TODO: only pass this if `language` gets detected on server
					},
				}
			},
})

// ------------------------------------------------------------------------------------------------

const initGenericServerWrapper = <Event extends Kit.RequestEvent>() => ({
	use:
		<Data extends Record<string, any> | void>(
			fn: (event: Event, runtime: SvelteKitServerRuntime) => Promise<Data> | Data,
		) =>
			async (event: Event): Promise<Data> => {
				const runtime = getRuntimeFromLocals(event.locals)

				return fn(event, runtime)
			},
})

export const initServerLoadWrapper = <ServerLoad extends Kit.ServerLoad<any, any, any, any>>() =>
	initGenericServerWrapper<Parameters<ServerLoad>[0]>()

export const initActionWrapper = <Action extends Kit.Action<any, any, any>>() =>
	initGenericServerWrapper<Parameters<Action>[0]>()

export const initRequestHandlerWrapper = <RequestHandler extends Kit.RequestHandler<any, any>>() =>
	initGenericServerWrapper<Parameters<RequestHandler>[0]>()
