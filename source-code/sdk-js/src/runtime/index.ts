import type { Resource } from "@inlang/core/ast"
import { createLookupFunction, LookupFunction } from "./lookup-function.js"

const dummyResource = {
	type: "Resource",
	languageTag: { type: "LanguageTag", name: "en" },
	body: [],
} satisfies Resource

const fallbackLookupFunction: LookupFunction = () => ""

export const initRuntime = <Language extends string>() => {
	const resourcesCache = new Map<Language, Resource>()
	let currentLanguage: Language

	const loadResource = async (language: Language) => {
		const resource = dummyResource // TODO: actually load resource
		resourcesCache.set(language, resource)
	}

	const switchLanguage = (language: Language) => (currentLanguage = language)

	// TODO: what should we do if `switchLanguage` was never called before? Throw an error? Return undefined? An empty string?
	const getCurrentLanguage = () => currentLanguage

	const getLookupFunctionForCurrentLanguage = () => {
		const resource = resourcesCache.get(currentLanguage)
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
