import type * as Ast from "@inlang/core/ast"
import {
	InlangFunctionBaseArgs,
	createInlangFunction,
	InlangFunction,
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
		getLanguage,
		getInlangFunction,
	}
}
