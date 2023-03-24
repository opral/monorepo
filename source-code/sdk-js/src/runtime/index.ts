import type { Resource } from "@inlang/core/ast"
import { createLookupFunction } from "./lookup-function.js"

const dummyResource = {
	type: "Resource",
	languageTag: { type: "LanguageTag", name: "en" },
	body: [],
} satisfies Resource

export const initRuntime = <Language extends string>() => {
	const resourcesCache = new Map<Language, Resource>()
	let currentLanguage: Language

	const loadResource = (language: Language) => {
		const resource = dummyResource // TODO: actually load resource
		resourcesCache.set(language, resource)
	}

	const switchLanguage = (language: Language) => (currentLanguage = language)

	const getLookupFunctionForCurrentLanguage = () => createLookupFunctionForLanguage(currentLanguage)

	const createLookupFunctionForLanguage = (language: Language) => {
		const resource = resourcesCache.get(language)
		if (!resource) return () => ""

		return createLookupFunction(resource)
	}

	return {
		loadResource,
		switchLanguage,
		getLookupFunctionForCurrentLanguage,
		createLookupFunctionForLanguage,
	}
}
