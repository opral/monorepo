import type * as Kit from "@sveltejs/kit"
import { detectLanguageTag, type Detector } from "../../../detectors/index.js"
import { initSvelteKitClientRuntime, type SvelteKitClientRuntime } from "../client/runtime.js"
import {
	addRuntimePromiseToEvent,
	addRuntimeToData,
	type ObjectWithClientRuntime,
	type EventWithRuntimePromise,
	getRuntimePromiseFromEvent,
	wait,
} from "./utils.js"
import type { LanguageTag, Message } from "@inlang/sdk"
import type { LayoutServerDataPayload } from "../server/wrappers.js"

// ------------------------------------------------------------------------------------------------

const cache: Record<LanguageTag, Message[] | undefined> = {}

type InitRuntimeForWrappersOptions = {
	initDetectors?: (event: Parameters<Kit.Load>[0]) => Detector[]
}

const initRuntimeForWrappers = async <Load extends Kit.Load<any, any, any, any, any>>(
	event: Parameters<Load>[0],
	options?: InitRuntimeForWrappersOptions,
): Promise<SvelteKitClientRuntime> => {
	const existingPromise = getRuntimePromiseFromEvent(event)
	if (existingPromise) return existingPromise

	if (!options) {
		await wait(0)
		return initRuntimeForWrappers(event, options)
	}

	let resolveRuntimePromise: (runtime: SvelteKitClientRuntime) => void = undefined as unknown as (
		runtime: SvelteKitClientRuntime,
	) => void

	addRuntimePromiseToEvent(event, new Promise((resolve) => (resolveRuntimePromise = resolve)))

	const runtime = await initRuntime(event, options, event.data["[inlang]"])

	resolveRuntimePromise(runtime)

	return runtime
}

const initRuntime = async (
	event: Parameters<Kit.Load>[0],
	options: InitRuntimeForWrappersOptions,
	data: LayoutServerDataPayload["[inlang]"],
) => {
	if (!data) {
		const useWarn = (defaultValue?: unknown) => () =>
			(import.meta.env.DEV &&
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				console.warn(
					"inlang was not correctly set up on this page. Please check the `routing.exclude` settings in your `project.inlang.json` file.",
				)!) ||
			defaultValue
		return {
			i: useWarn(""),
			loadMessages: useWarn(),
			changeLanguageTag: useWarn(),
			languageTags: [],
		} as Partial<SvelteKitClientRuntime> as SvelteKitClientRuntime
	}

	const { sourceLanguageTag, languageTags, languageTag: language } = data

	// TODO: only add this conditional logic if shared detection strategies get used
	const languageTag =
		language || !options.initDetectors
			? language
			: await detectLanguageTag(
					{ sourceLanguageTag, languageTags },
					...options.initDetectors(event),
			  )

	return initSvelteKitClientRuntime({
		fetch: event.fetch,
		sourceLanguageTag,
		languageTags,
		languageTag,
		cache,
	})
}

// ------------------------------------------------------------------------------------------------

export const initRootLayoutLoadWrapper = <
	LayoutLoad extends Kit.Load<any, any, any, any, any>,
>(options: {
	initDetectors?: (event: Parameters<LayoutLoad>[0]) => Detector[]
}) => ({
	use:
		<Data extends Record<string, any> | void>(
			load: (
				event: EventWithRuntimePromise<Parameters<LayoutLoad>[0]>,
				runtime: SvelteKitClientRuntime,
			) => Promise<Data> | Data,
		) =>
		async (event: Parameters<LayoutLoad>[0]): Promise<ObjectWithClientRuntime<Data>> => {
			const runtime = await initRuntimeForWrappers(event, options)

			const payload = await load(event, runtime)

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { "[inlang]": _, ...data } = payload || event.data

			return addRuntimeToData(data, runtime)
		},
})

// ------------------------------------------------------------------------------------------------

export const initRootPageLoadWrapper = <
	PageLoad extends Kit.Load<any, any, any, any, any>,
>(options: {
	browser: boolean
	initDetectors?: (event: Parameters<PageLoad>[0]) => Detector[]
	redirect?: {
		throwable: typeof Kit.redirect
		getPath: (event: Parameters<PageLoad>[0], languageTag: LanguageTag) => URL | string
	}
}) => ({
	use:
		<Data extends Record<string, any> | void>(
			load: (
				event: EventWithRuntimePromise<Parameters<PageLoad>[0]>,
				runtime: SvelteKitClientRuntime,
			) => Promise<Data> | Data,
		) =>
		async (event: Parameters<PageLoad>[0]): Promise<Data> => {
			const data = await event.parent()

			const languageTag: LanguageTag | undefined = data.languageTag

			if (!languageTag && options.browser) {
				const { sourceLanguageTag, languageTags } = data

				if ((!languageTag || !languageTags.includes(languageTag)) && options.redirect) {
					const detectedLanguageTag = await detectLanguageTag(
						{ sourceLanguageTag, languageTags },
						...(options.initDetectors ? options.initDetectors(event) : []),
					)

					throw options.redirect.throwable(
						307,
						options.redirect.getPath(event, detectedLanguageTag).toString(),
					)
				}
			}

			const runtime = await initRuntimeForWrappers(event)

			return load(event, runtime)
		},
})

// ------------------------------------------------------------------------------------------------

export const initLoadWrapper = <Load extends Kit.Load<any, any, any, any, any>>() => ({
	use:
		<Data extends Record<string, any> | void>(
			load: (
				event: EventWithRuntimePromise<Parameters<Load>[0]>,
				runtime: SvelteKitClientRuntime,
			) => Promise<Data> | Data,
		) =>
		async (event: Parameters<Load>[0]): Promise<Data> => {
			const runtime = await initRuntimeForWrappers(event)

			return load(event, runtime)
		},
})
