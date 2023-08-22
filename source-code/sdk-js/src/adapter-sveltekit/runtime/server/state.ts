import type { RequestEvent } from "@sveltejs/kit"
import { initTransformConfig, type TransformConfig } from "../../vite-plugin/config/index.js"
import { inlangSymbol } from "../shared/utils.js"
import type { SvelteKitServerRuntime } from "./runtime.js"
import type { LanguageTag } from "@inlang/app"
import type { Message } from "@inlang/messages"

type State = Pick<TransformConfig, "sourceLanguageTag" | "languageTags" | "messages">

let state: State

export const initState = async () => {
	if (!state && !import.meta.env.DEV) {
		try {
			const { languageTags, sourceLanguageTag, messages } = await import("virtual:inlang-static")
			state = {
				sourceLanguageTag,
				languageTags,
				messages: () => messages,
			} as State
		} catch {
			/* empty */
		}
	}

	if (!state) {
		const config = await initTransformConfig()
		state = {
			sourceLanguageTag: config.sourceLanguageTag,
			languageTags: config.languageTags,
			messages: config.messages,
		}
	}

	await reloadMessages()

	return {
		sourceLanguageTag: state.sourceLanguageTag,
		languageTags: state.languageTags,
	}
}

// ------------------------------------------------------------------------------------------------

let _messages: Message[] = []

// TODO: fix resources if needed (add missing Keys, etc.)
export const reloadMessages = async () => (_messages = state?.messages()) || []

export const loadMessages = (languageTag: LanguageTag) => _messages // TODO: filter out language variants

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
