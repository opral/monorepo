import type * as Ast from "@inlang/core/ast"
import {
	InlangFunctionBaseArgs,
	createInlangFunction,
	InlangFunction,
	InlangString,
} from "./inlang-function.js"

const fallbackInlangFunction: InlangFunction = () => "" as InlangString

type MaybePromise<T> = T | Promise<T>

export type RuntimeContext<Language extends Ast.Language = Ast.Language> = {
	readResource: (language: Language) => MaybePromise<Ast.Resource | undefined>
}

export type RuntimeState<Language extends Ast.Language = Ast.Language> = {
	resources: Map<Language, Ast.Resource>
	language: Language | undefined
}

export const initRuntime = <
	Language extends Ast.Language,
	InlangFunctionArgs extends InlangFunctionBaseArgs = InlangFunctionBaseArgs,
>(
	context: RuntimeContext,
) => initBaseRuntime<Language, InlangFunctionArgs>(context)

export type Runtime = ReturnType<typeof initRuntime>

export const initBaseRuntime = <
	Language extends Ast.Language,
	InlangFunctionArgs extends InlangFunctionBaseArgs = InlangFunctionBaseArgs,
>(
	{ readResource }: RuntimeContext<Language>,
	state: RuntimeState<Language> = {
		resources: new Map(),
		language: undefined,
	},
) => {
	// TODO: make this a function that can ba a Promise or Sync
	const loadResource = async (language: Language) => {
		const resource = await readResource(language)
		resource && state.resources.set(language, resource)
	}

	const switchLanguage = (language: Language) => (state.language = language)

	const getLanguage = () => state.language

	const getInlangFunction = () => {
		const resource = state.resources.get(state.language as Language)
		if (!resource) return fallbackInlangFunction

		return createInlangFunction<InlangFunctionArgs>(resource)
	}

	return {
		loadResource,
		switchLanguage,
		get language() {
			return getLanguage()
		},
		get i() {
			return getInlangFunction()
		}
	}
}

// TODO: test this
export const initRuntimeWithLanguageInformation = <
	Language extends Ast.Language,
	InlangFunctionArgs extends InlangFunctionBaseArgs = InlangFunctionBaseArgs,
>(
	context: RuntimeContext<Language> & {
		referenceLanguage: Language
		languages: Language[]
	},
	state: RuntimeState<Language> = {
		resources: new Map(),
		language: undefined,
	},
) => {
	const runtime = initBaseRuntime<Language, InlangFunctionArgs>(context, state)

	return {
		...runtime,
		get language() {
			return runtime.language
		},
		get i() {
			return runtime.i
		},
		get referenceLanguage() {
			return context.referenceLanguage
		},
		get languages() {
			return context.languages
		},
	}
}
