import type { Resource } from "@inlang/core/ast"
import type { InlangConfig, InlangConfigModule } from "@inlang/core/config"
import type { RequestEvent } from "@sveltejs/kit"
import { initConfig } from "../../../config/config.js"
import { inlangSymbol } from "../shared/utils.js"
import type { SvelteKitServerRuntime } from "./runtime.js"
import type { BCP47LanguageTag } from '@inlang/core/languageTag'

let config: InlangConfig

export const initState = async (module: InlangConfigModule) => {
	if (!config && !import.meta.env.DEV) {
		try {
			const { languageTags, sourceLanguageTag, resources } = await import("virtual:inlang-static")

			config = {
				sourceLanguageTag,
				languageTags,
				readResources: async () => resources,
				writeResources: async () => undefined,
			} as InlangConfig
		} catch {
			/* empty */
		}
	}

	if (!config) {
		config = await initConfig(module)
	}

	await reloadResources()

	return {
		sourceLanguageTag: config.sourceLanguageTag,
		languageTags: config.languageTags,
	}
}

// ------------------------------------------------------------------------------------------------

let _resources: Resource[] = []

// TODO: fix resources if needed (add missing Keys, etc.)
export const reloadResources = async () => (_resources = await config.readResources({ config }))

export const getResource = (languageTag: BCP47LanguageTag) =>
	_resources.find(({ languageTag: { name } }) => name === languageTag)

// ------------------------------------------------------------------------------------------------

export const addRuntimeToLocals = (
	locals: RequestEvent["locals"],
	runtime: SvelteKitServerRuntime,
) => ((locals as any)[inlangSymbol] = runtime)

export const getRuntimeFromLocals = (locals: RequestEvent["locals"]): SvelteKitServerRuntime =>
	(locals as any)[inlangSymbol]
