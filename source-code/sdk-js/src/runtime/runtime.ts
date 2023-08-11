import {
	type InlangFunctionBaseArgs,
	createInlangFunction,
	type InlangFunction,
} from "./inlang-function.js"
import type { LanguageTag as LanguageTagBase, Message } from "@inlang/app"
import { logDeprecation } from "../utils.js"

export const isAsync = <T>(p: unknown): p is Promise<T> =>
	!!p && typeof p === "object" && typeof (p as Promise<T>).then === "function"

type MaybePromise<T> = T | Promise<T>

export type RuntimeContext<
	LanguageTag extends LanguageTagBase = LanguageTagBase,
	LoadMessagesMaybePromise extends
		| (Message[] | undefined)
		| Promise<Message[] | undefined> = MaybePromise<Message[] | undefined>,
> = {
	loadMessages: (languageTag: LanguageTag) => LoadMessagesMaybePromise
}

export type RuntimeState<LanguageTag extends LanguageTagBase = LanguageTagBase> = {
	messages: Message[]
	languageTag: LanguageTag | undefined
	i: InlangFunction<any> | undefined
}

export const initRuntime = <
	LanguageTag extends LanguageTagBase,
	LoadMessagesMaybePromise extends (Message[] | undefined) | Promise<Message[] | undefined>,
	InlangFunctionArgs extends InlangFunctionBaseArgs = InlangFunctionBaseArgs,
>(
	context: RuntimeContext<LanguageTag, LoadMessagesMaybePromise>,
) => initBaseRuntime<LanguageTag, LoadMessagesMaybePromise, InlangFunctionArgs>(context)

export type Runtime = ReturnType<typeof initRuntime>

const mergeMessages = (oldMessages: Message[], newMessages: Message[]) => {
	for (const newMessage of newMessages) {
		const message = oldMessages.find(({ id }) => id === newMessage.id)
		if (!message) {
			oldMessages.push(newMessage)
		} else {
			message.body = { ...message.body, ...newMessage.body }
		}
	}
}

export const initBaseRuntime = <
	LanguageTag extends LanguageTagBase,
	LoadMessagesMaybePromise extends (Message[] | undefined) | Promise<Message[] | undefined>,
	InlangFunctionArgs extends InlangFunctionBaseArgs = InlangFunctionBaseArgs,
>(
	{ loadMessages }: RuntimeContext<LanguageTag, LoadMessagesMaybePromise>,
	state: RuntimeState<LanguageTag> = {
		messages: [],
		languageTag: undefined,
		i: undefined,
	},
) => {
	const loadMessagesPromises = new Map<LanguageTag, LoadMessagesMaybePromise>()
	let isLoadMessagesFunctionAsync = false
	const loadedLanguageTags: LanguageTag[] = []

	const _loadMessages = (languageTag: LanguageTag): LoadMessagesMaybePromise => {
		if (loadedLanguageTags.includes(languageTag))
			return isLoadMessagesFunctionAsync
				? (Promise.resolve() as LoadMessagesMaybePromise)
				: (undefined as LoadMessagesMaybePromise)

		if (loadMessagesPromises.has(languageTag))
			return loadMessagesPromises.get(languageTag) as LoadMessagesMaybePromise

		const setMessages = (messages: Message[] | undefined) => {
			if (!messages) return
			mergeMessages(state.messages, messages)
			loadedLanguageTags.push(languageTag)
		}

		const messagesMaybePromise = loadMessages(languageTag)
		if (!isAsync(messagesMaybePromise)) {
			setMessages(messagesMaybePromise)
			return undefined as LoadMessagesMaybePromise
		}

		isLoadMessagesFunctionAsync = true

		// eslint-disable-next-line no-async-promise-executor
		const promise = new Promise<void>(async (resolve) => {
			const messages = await messagesMaybePromise
			setMessages(messages as Message[] | undefined)

			loadMessagesPromises.delete(languageTag)
			resolve()
		}) as LoadMessagesMaybePromise

		loadMessagesPromises.set(languageTag, promise)

		return promise
	}

	const changeLanguageTag = (languageTag: LanguageTag) => {
		state.languageTag = languageTag
		state.i = undefined
	}

	const getInlangFunction = () => {
		if (state.i) return state.i

		return (state.i = createInlangFunction<InlangFunctionArgs>(state.messages, state.languageTag!))
	}

	return {
		loadMessages: _loadMessages,
		changeLanguageTag,
		get languageTag() {
			return state.languageTag
		},
		get i() {
			return getInlangFunction()
		},
		/** @deprecated Use `changeLanguageTag` instead. */
		switchLanguage: (...args: Parameters<typeof changeLanguageTag>) => {
			logDeprecation("switchLanguage", "changeLanguageTag")
			return changeLanguageTag(...args)
		},
		/** @deprecated Use `languageTag` instead. */
		get language() {
			logDeprecation("language", "languageTag")
			return this.languageTag
		},
	}
}

export const initRuntimeWithLanguageInformation = <
	LanguageTag extends LanguageTagBase,
	LoadMessagesMaybePromise extends (Message[] | undefined) | Promise<Message[] | undefined>,
	InlangFunctionArgs extends InlangFunctionBaseArgs = InlangFunctionBaseArgs,
>(
	context: RuntimeContext<LanguageTag, LoadMessagesMaybePromise> & {
		sourceLanguageTag: LanguageTag
		languageTags: LanguageTag[]
	},
) => {
	const runtime = initBaseRuntime<LanguageTag, LoadMessagesMaybePromise, InlangFunctionArgs>(
		context,
	)

	return {
		...runtime,
		get languageTag() {
			return runtime.languageTag
		},
		get i() {
			return runtime.i
		},
		get sourceLanguageTag() {
			return context.sourceLanguageTag
		},
		get languageTags() {
			return context.languageTags
		},
		/** @deprecated Use `languageTag` instead. */
		get language(): LanguageTag | undefined {
			return runtime.language
		},
		/** @deprecated Use `sourceLanguageTag` instead. */
		get referenceLanguage(): LanguageTag {
			logDeprecation("referenceLanguage", "sourceLanguageTag")
			return this.sourceLanguageTag
		},
		/** @deprecated Use `languageTags` instead. */
		get languages(): LanguageTag[] {
			logDeprecation("languages", "languageTags")
			return this.languageTags
		},
	}
}
