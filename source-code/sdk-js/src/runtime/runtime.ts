import type { Resource } from "@inlang/core/ast"
import { createLookupFunction, LookupFunction } from "./lookup-function.js"

const dummyResource = {
	type: "Resource",
	languageTag: { type: "LanguageTag", name: "en" },
	body: [],
} satisfies Resource

const fallbackLookupFunction: LookupFunction = () => ""

type RuntimeState<Language extends string> = {
	resources: Map<Language, Resource>
	language: Language
}

export const initRuntime = <Language extends string>(
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
	const getCurrentLanguage = () => state.language

	const getLookupFunctionForCurrentLanguage = () => {
		const resource = state.resources.get(state.language)
		if (!resource) return fallbackLookupFunction

		return createLookupFunction(resource)
	}

	return {
		loadResource,
		switchLanguage,
		getCurrentLanguage,
		getLookupFunctionForCurrentLanguage,
	}
}
