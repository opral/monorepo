import {
	type InlangFunctionBaseArgs,
	createInlangFunction,
	type InlangFunction,
} from "./inlang-function.js"
import type { LanguageTag as LanguageTagBase, Message } from "@inlang/sdk"
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
	const messages = structuredClone(oldMessages)
	for (const newMessage of newMessages) {
		const message = messages.find(({ id }) => id === newMessage.id)
		if (!message) {
			messages.push(newMessage)
		} else {
			message.variants = [...message.variants, ...newMessage.variants]
		}
	}

	return messages
}

export const initBaseRuntime = <
	LanguageTag extends LanguageTagBase,
	LoadMessagesMaybePromise extends (Message[] | undefined) | Promise<Message[] | undefined>,
	InlangFunctionArgs extends InlangFunctionBaseArgs = InlangFunctionBaseArgs,
>(
	{ loadMessages }: RuntimeContext<LanguageTag, LoadMessagesMaybePromise>,
	VirtualModule: RuntimeState<LanguageTag> = {
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
			VirtualModule.messages = mergeMessages(VirtualModule.messages, messages)
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
		VirtualModule.languageTag = languageTag
		VirtualModule.i = undefined
	}

	const getInlangFunction = () => {
		if (VirtualModule.i) return VirtualModule.i

		return (VirtualModule.i = createInlangFunction<InlangFunctionArgs>(
			VirtualModule.messages,
			VirtualModule.languageTag!,
		))
	}

	return {
		loadMessages: _loadMessages,
		changeLanguageTag,
		get languageTag() {
			return VirtualModule.languageTag
		},
		get i() {
			return getInlangFunction()
		},
		/** @deprecated Use `changeLanguageTag` instead. */
		switchLanguage: (...args: Parameters<typeof changeLanguageTag>) => {
			logDeprecation("switchLanguage", "changeLanguageTag")
			return changeLanguageTag(...args)
		},
		/** @deprecated Use `loadMessages` instead. */
		loadResource: (...args: Parameters<typeof loadMessages>) => {
			logDeprecation("loadResource", "loadMessages")
			return _loadMessages(...args)
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
		loadMessages: runtime.loadMessages,
		changeLanguageTag: runtime.changeLanguageTag,
		get i() {
			return runtime.i
		},
		get languageTag() {
			return runtime.languageTag
		},
		get sourceLanguageTag() {
			return context.sourceLanguageTag
		},
		get languageTags() {
			return context.languageTags
		},
		/** @deprecated Use `changeLanguageTag` instead. */
		switchLanguage: (...args: Parameters<typeof runtime.switchLanguage>) => {
			return runtime.switchLanguage(...args)
		},
		/** @deprecated Use `loadMessages` instead. */
		loadResource: (...args: Parameters<typeof runtime.loadResource>) => {
			return runtime.loadResource(...args)
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
