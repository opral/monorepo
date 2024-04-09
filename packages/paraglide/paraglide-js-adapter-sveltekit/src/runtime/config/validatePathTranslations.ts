import type { ParamMatcher, RouteParam } from "@sveltejs/kit"
import { parse_route_id } from "../path-translations/matching/routing.js"
import type { PathTranslations } from "./pathTranslations.js"

export type PathTranslationIssue = {
	path: string
	message: string
}

/**
 * Check that the path translations are valid.
 * Should only be called in development, this is a waste of time in production.
 */
export function validatePathTranslations<T extends string>(
	pathTranslations: PathTranslations<T>,
	availableLanguageTags: readonly T[],
	matchers: Record<string, ParamMatcher>
): PathTranslationIssue[] {
	const issues: PathTranslationIssue[] = []

	/** The languages that are available */
	const expectedLanguages = new Set(availableLanguageTags)

	/** The names of the matchers that are available */
	const availableMatchers = new Set(Object.keys(matchers))

	for (const path in pathTranslations) {
		if (!isValidPath(path)) {
			issues.push({
				path,
				message: "Path must start with a slash.",
			})
			continue
		}

		const { params: expectedParams } = parse_route_id(path)

		const expectedMatchers = expectedParams.map((param) => param.matcher).filter(Boolean)

		for (const matcher of expectedMatchers) {
			if (!availableMatchers.has(matcher)) {
				issues.push({
					path,
					message: `Matcher ${matcher} is used but not available. Did you forget to pass it to createI18n?`,
				})
			}
		}

		//@ts-ignore
		const translations = pathTranslations[path]
		if (!translations) continue

		for (const [lang, translatedPath] of Object.entries(translations) as [string, string][]) {
			if (!isValidPath(translatedPath)) {
				issues.push({
					path,
					message: `The translation for language ${lang} must start with a slash.`,
				})
			}

			const { params: actualParams } = parse_route_id(translatedPath)

			let paramsDontMatch = false

			for (const param of expectedParams) {
				if (!actualParams.some((actualParam) => paramsAreEqual(param, actualParam))) {
					paramsDontMatch = true
				}
			}

			if (expectedParams.length !== actualParams.length) {
				paramsDontMatch = true
			}

			if (paramsDontMatch) {
				issues.push({
					path,
					message: `The translation for language ${lang} must have the same parameters as the canonical path.`,
				})
			}
		}

		//Check that all languages are translated
		const translatedLanguages = new Set(Object.keys(translations))
		if (!isSubset(expectedLanguages, translatedLanguages)) {
			const missingLanguages = new Set(expectedLanguages)
			for (const lang of translatedLanguages) {
				missingLanguages.delete(lang as T)
			}
			issues.push({
				path,
				message: `The following languages are missing translations: ${[...missingLanguages].join(
					", "
				)}`,
			})
		}
	}

	return issues
}

function paramsAreEqual(param1: RouteParam, param2: RouteParam): boolean {
	return (
		param1.chained == param2.chained &&
		param1.matcher == param2.matcher &&
		param1.name == param2.name &&
		param1.optional == param2.optional &&
		param1.rest == param2.rest
	)
}

function isValidPath(maybePath: string): maybePath is `/${string}` {
	return maybePath.startsWith("/")
}

function isSubset<T>(a: Set<T>, b: Set<T>): boolean {
	for (const value of a) {
		if (!b.has(value)) return false
	}
	return true
}
