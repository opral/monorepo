import type { Resource } from "@inlang/core/ast"
import { BaseLookupFunctionArgs, createLookupFunction, LookupFunction } from "./lookup-function.js"

const fallbackLookupFunction: LookupFunction = () => ""

export type RuntimeContext<Language extends string = string> = {
	readResource: (language: Language) => Promise<Resource | undefined>
}

export type RuntimeState<Language extends string = string> = {
	resources: Map<Language, Resource>
	language: Language | undefined
}

export const initRuntime = <
	Language extends string,
	LookupFunctionArgs extends BaseLookupFunctionArgs = BaseLookupFunctionArgs,
>(
	context: RuntimeContext,
) => initBaseRuntime<Language, LookupFunctionArgs>(context)

export const initBaseRuntime = <
	Language extends string,
	LookupFunctionArgs extends BaseLookupFunctionArgs = BaseLookupFunctionArgs,
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

	const getLookupFunction = () => {
		const resource = state.resources.get(state.language as Language)
		if (!resource) return fallbackLookupFunction

		return createLookupFunction<LookupFunctionArgs>(resource)
	}

	return {
		loadResource,
		switchLanguage,
		getLanguage,
		getLookupFunction,
	}
}
