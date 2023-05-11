import type { Resource } from '@inlang/core/ast'
import type { InlangConfig, InlangConfigModule } from '@inlang/core/config'
import type { RequestEvent } from "@sveltejs/kit"
import { initConfig } from '../../../config/config.js'
import { inlangSymbol } from "../shared/utils.js"
import type { SvelteKitServerRuntime } from "./runtime.js"
import { languages, referenceLanguage, resources } from "virtual:inlang-static"

let config: InlangConfig

export const initState = async (module: InlangConfigModule) => {
	if (!config) {
		config = import.meta.env.DEV
			? await initConfig(module)
			: {
				referenceLanguage,
				languages,
				readResources: async () => resources,
				writeResources: async () => undefined
			} as InlangConfig
	}

	await reloadResources()

	return {
		referenceLanguage: config.referenceLanguage,
		languages: config.languages,
	}
}

// ------------------------------------------------------------------------------------------------

let _resources: Resource[] = []

// TODO: fix resources if needed (add missing Keys, etc.)
export const reloadResources = async () => _resources = await config.readResources({ config })

export const getResource = (language: string) =>
	_resources.find(({ languageTag: { name } }) => name === language)

// ------------------------------------------------------------------------------------------------

export const addRuntimeToLocals = (
	locals: RequestEvent["locals"],
	runtime: SvelteKitServerRuntime,
) => ((locals as any)[inlangSymbol] = runtime)

export const getRuntimeFromLocals = (locals: RequestEvent["locals"]): SvelteKitServerRuntime =>
	(locals as any)[inlangSymbol]
