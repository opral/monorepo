import type { RequestEvent } from "@sveltejs/kit"
import type { VirtualModule } from "../../vite-plugin/config/index.js"
import { inlangSymbol } from "../shared/utils.js"
import type { SvelteKitServerRuntime } from "./runtime.js"
import type { LanguageTag } from "@inlang/sdk"

type State = Pick<VirtualModule, "sourceLanguageTag" | "languageTags" | "messages">

let state: State

export const initState = async () => {
	if (!state) {
		if (import.meta.env.DEV) {
			const { initVirtualModule } = await import("../../vite-plugin/config/index.js")
			const config = await initVirtualModule()
			state = {
				sourceLanguageTag: config.sourceLanguageTag,
				languageTags: config.languageTags,
				messages: config.messages,
			}
		} else {
			try {
				const { languageTags, sourceLanguageTag, messages } = await import("virtual:inlang-static")
				state = {
					sourceLanguageTag,
					languageTags,
					messages: messages,
				} as State
			} catch {
				/* empty */
			}
		}
	}

	return {
		sourceLanguageTag: state.sourceLanguageTag,
		languageTags: state.languageTags,
	}
}

// ------------------------------------------------------------------------------------------------

// TODO: fix resources if needed with fallback logic https://github.com/opral/monorepo/discussions/1267
export const loadMessages = (languageTag: LanguageTag) =>
	state?.messages.map((message) => ({
		...message,
		variants: message.variants.filter((variant) => variant.languageTag === languageTag),
	}))

// ------------------------------------------------------------------------------------------------

// ------------------------------------------------------------------------------------------------

type ObjectWithServerRuntime<Data extends Record<string, unknown> = Record<string, unknown>> =
	Data & {
		[inlangSymbol]: SvelteKitServerRuntime
	}

export const addRuntimeToLocals = (
	locals: RequestEvent["locals"],
	runtime: SvelteKitServerRuntime,
) => ((locals as ObjectWithServerRuntime)[inlangSymbol] = runtime)

export const getRuntimeFromLocals = (locals: RequestEvent["locals"]): SvelteKitServerRuntime =>
	(locals as ObjectWithServerRuntime)[inlangSymbol]
