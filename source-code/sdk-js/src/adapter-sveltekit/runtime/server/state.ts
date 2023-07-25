import type { Resource } from "@inlang/core/ast"
import type { InlangConfig, InlangConfigModule } from "@inlang/core/config"
import type { RequestEvent } from "@sveltejs/kit"
import { initConfig } from "../../../config/config.js"
import { inlangSymbol } from "../shared/utils.js"
import type { SvelteKitServerRuntime } from "./runtime.js"

let config: InlangConfig | undefined

export const initState = async (module: InlangConfigModule) => {
	if (!config && !import.meta.env.DEV) {
		try {
			const { languages, referenceLanguage, resources } = await import("virtual:inlang-static")

			config = {
				referenceLanguage,
				languages,
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
		referenceLanguage: config.referenceLanguage,
		languages: config.languages,
	}
}

// ------------------------------------------------------------------------------------------------

let _resources: Resource[] = []

// TODO: fix resources if needed (add missing Keys, etc.)
export const reloadResources = async () =>
	(_resources = (await config?.readResources({ config })) || [])

export const getResource = (language: string) =>
	_resources.find(({ languageTag: { name } }) => name === language)

// ------------------------------------------------------------------------------------------------

export const addRuntimeToLocals = (
	locals: RequestEvent["locals"],
	runtime: SvelteKitServerRuntime,
) => ((locals as any)[inlangSymbol] = runtime)

export const getRuntimeFromLocals = (locals: RequestEvent["locals"]): SvelteKitServerRuntime =>
	(locals as any)[inlangSymbol]
