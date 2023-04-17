import type { Language } from '@inlang/core/ast'
import type { Load } from "@sveltejs/kit"
import { initSvelteKitClientRuntime, SvelteKitClientRuntime } from '../client/runtime.js'
import { addRuntimeToData, inlangSymbol } from '../shared/utils.js'

// ------------------------------------------------------------------------------------------------

export type DataPayload = {
	referenceLanguage: Language
	languages: Language[]
	language: Language | undefined
}

export const initRootLayoutLoadWrapper = <LayoutLoad extends Load<any, any, any, any, any>>() => ({
	wrap: <Data extends Record<string, any> | void>(load: (event: Parameters<LayoutLoad>[0]) =>
		Promise<Data> | Data) => async (event: Parameters<LayoutLoad>[0]): Promise<Data & { [inlangSymbol]: SvelteKitClientRuntime }> => {
			const data = event.data as DataPayload

			const runtime = await initSvelteKitClientRuntime({
				fetch: event.fetch,
				language: data.language!,
				referenceLanguage: data.referenceLanguage,
				languages: data.languages,
			})

			return addRuntimeToData({
				...(await load(event)),
				referenceLanguage: runtime.referenceLanguage, // TODO: only pass this if `referenceLanguage` gets used somewhere or detection strategy is on client
				languages: runtime.languages, // TODO: only pass this if `languages` get used somewhere
				language: runtime.language, // TODO: only pass this if `language` gets detected on server}
			}, runtime)
		}
})