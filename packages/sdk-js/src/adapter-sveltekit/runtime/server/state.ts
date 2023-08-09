import type { InlangConfig, InlangConfigModule } from "@inlang/core/config"
import type { RequestEvent } from "@sveltejs/kit"
import { initConfig } from "../../../config/config.js"
import { inlangSymbol } from "../shared/utils.js"
import type { SvelteKitServerRuntime } from "./runtime.js"
import type { LanguageTag } from "@inlang/app"
import type { Message } from '@inlang/messages'

let config: InlangConfig | undefined

export const initState = async (module: InlangConfigModule) => {
	if (!config && !import.meta.env.DEV) {
		try {
			const { languageTags, sourceLanguageTag, resources } = await import("virtual:inlang-static")

			config = {
				sourceLanguageTag,
				languageTags,
				readResources: async () => resources,
				writeResources: async () => undefined,
			} as any as InlangConfig
		} catch {
			/* empty */
		}
	}

	if (!config) {
		config = await initConfig(module)
	}

	await reloadMessages()

	return {
		sourceLanguageTag: config.referenceLanguage,
		languageTags: config.languages,
	}
}

// ------------------------------------------------------------------------------------------------

let _messages: Message[] = []

// TODO: fix resources if needed (add missing Keys, etc.)
export const reloadMessages = async () =>
	(_messages = (await config?.readResources({ config })) as any || [])

export const loadMessages = (languageTag: LanguageTag) =>
	_messages // TODO: filter

// ------------------------------------------------------------------------------------------------

export const addRuntimeToLocals = (
	locals: RequestEvent["locals"],
	runtime: SvelteKitServerRuntime,
) => ((locals as any)[inlangSymbol] = runtime)

export const getRuntimeFromLocals = (locals: RequestEvent["locals"]): SvelteKitServerRuntime =>
	(locals as any)[inlangSymbol]
