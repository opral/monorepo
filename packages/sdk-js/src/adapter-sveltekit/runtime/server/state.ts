import type { Resource } from '@inlang/core/ast'
import type { InlangConfigModule } from '@inlang/core/config'
import type { RequestEvent } from "@sveltejs/kit"
import { initConfig, InlangConfigWithSdkProps } from '../../../config/config.js'
import { inlangSymbol } from "../shared/utils.js"
import type { SvelteKitServerRuntime } from "./runtime.js"

let config: InlangConfigWithSdkProps

export const initState = async (module: InlangConfigModule) => {
	if (!config) {
		config = await initConfig(module)
	}

	await reloadResources()

	return {
		referenceLanguage: config.referenceLanguage,
		languages: config.languages,
	}
}

// ------------------------------------------------------------------------------------------------

let resources: Resource[] = []

// TODO: fix resources if needed (add missing Keys, etc.)
export const reloadResources = async () => resources = await config.readResources({ config })

export const getResource = (language: string) =>
	resources.find(({ languageTag: { name } }) => name === language)

// ------------------------------------------------------------------------------------------------

export const addRuntimeToLocals = (
	locals: RequestEvent["locals"],
	runtime: SvelteKitServerRuntime,
) => ((locals as any)[inlangSymbol] = runtime)

export const getRuntimeFromLocals = (locals: RequestEvent["locals"]): SvelteKitServerRuntime =>
	(locals as any)[inlangSymbol]
