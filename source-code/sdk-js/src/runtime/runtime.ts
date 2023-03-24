import type { Resource } from "@inlang/core/ast"
import { BaseLookupFunctionArgs, createLookupFunction, LookupFunction } from "./lookup-function.js"

const dummyResource = {
	type: "Resource",
	languageTag: { type: "LanguageTag", name: "en" },
	body: [],
} satisfies Resource

const fallbackLookupFunction: LookupFunction = () => ""

export type RuntimeState<Language extends string = string> = {
	resources: Map<Language, Resource>
	language: Language
}

export const initRuntime = <
	Language extends string,
	LookupFunctionArgs extends BaseLookupFunctionArgs = BaseLookupFunctionArgs,
>() => initBaseRuntime<Language, LookupFunctionArgs>()

export const initBaseRuntime = <
	Language extends string,
	LookupFunctionArgs extends BaseLookupFunctionArgs = BaseLookupFunctionArgs,
>(
	state: RuntimeState<Language> = {
		resources: new Map(),
		language: undefined as unknown as Language, // TODO: what is the default value?
	},
) => {
	const loadResource = async (language: Language) => {
		const resource = dummyResource // TODO: actually load resource
		state.resources.set(language, resource)
	}

	const switchLanguage = (language: Language) => (state.language = language)

	// TODO: what should we do if `switchLanguage` was never called before? Throw an error? Return undefined? An empty string?
	const getLanguage = () => state.language

	const getLookupFunction = () => {
		const resource = state.resources.get(state.language)
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
