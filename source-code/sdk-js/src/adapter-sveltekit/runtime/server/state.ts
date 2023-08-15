import type { RequestEvent } from '@sveltejs/kit'
import { initInlangApp } from "../../../adapter-sveltekit/vite-plugin/inlang-app.js"
import { inlangSymbol } from "../shared/utils.js"
import type { SvelteKitServerRuntime } from "./runtime.js"
import type { LanguageTag } from "@inlang/app"
import type { Message } from "@inlang/messages"

type State = {
	sourceLanguageTag: LanguageTag,
	languageTags: LanguageTag[],
	readMessages: () => Promise<Message[]>
}

let state: State

export const initState = async () => {
	if (!state && !import.meta.env.DEV) {
		try {
			const { languageTags, sourceLanguageTag, messages } = await import("virtual:inlang-static")
			state = {
				sourceLanguageTag,
				languageTags,
				readMessages: async () => messages,
			} as State
		} catch {
			/* empty */
		}
	}

	if (!state) {
		const inlang = await initInlangApp()
		state = {
			sourceLanguageTag: inlang.inlang.config().sourceLanguageTag,
			languageTags: inlang.inlang.config().languageTags,
			readMessages: async () => inlang.inlang.query.messages.getAll(),
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
export const reloadMessages = async () =>
	(_messages = (await state?.readMessages()) || [])

export const loadMessages = (languageTag: LanguageTag) => _messages // TODO: filter

// ------------------------------------------------------------------------------------------------

export const addRuntimeToLocals = (
	locals: RequestEvent["locals"],
	runtime: SvelteKitServerRuntime,
) => ((locals as any)[inlangSymbol] = runtime)

export const getRuntimeFromLocals = (locals: RequestEvent["locals"]): SvelteKitServerRuntime =>
	(locals as any)[inlangSymbol]
