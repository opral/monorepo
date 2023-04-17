import type { Language } from '@inlang/core/ast'
import type { Load } from "@sveltejs/kit"
import { detectLanguage, Detector } from '../../../detectors/index.js'
import { initSvelteKitClientRuntime, SvelteKitClientRuntime } from '../client/runtime.js'
import { addRuntimeToData, inlangSymbol } from '../shared/utils.js'

// ------------------------------------------------------------------------------------------------

export type DataPayload = {
	referenceLanguage: Language
	languages: Language[]
	language: Language | undefined
}

export const initRootLayoutLoadWrapper = <LayoutLoad extends Load<any, any, any, any, any>>(options: {
	initDetectors?: (event: Parameters<LayoutLoad>[0]) => Detector[],
}) => ({
	wrap: <Data extends Record<string, any> | void>(load: (event: Parameters<LayoutLoad>[0]) =>
		Promise<Data> | Data) => async (event: Parameters<LayoutLoad>[0]): Promise<Data & { [inlangSymbol]: SvelteKitClientRuntime }> => {
			const data = event.data as DataPayload

			const { referenceLanguage, languages } = data

			// TODO: only add this conditional logic if client detection strategies get used
			const language = (data.language || !options.initDetectors)
				? data.language
				: await detectLanguage(
					{ referenceLanguage, languages },
					...options.initDetectors(event),
				)

			const runtime = await initSvelteKitClientRuntime({
				fetch: event.fetch,
				language: language!,
				referenceLanguage,
				languages,
			})

			return addRuntimeToData({
				...(await load(event)),
				referenceLanguage, // TODO: only pass this if `referenceLanguage` gets used somewhere or detection strategy is on client
				languages, // TODO: only pass this if `languages` get used somewhere
				language, // TODO: only pass this if `language` gets detected on server}
			}, runtime)
		}
})