import { parsePathDefinition } from "../path-translations/matching/parse.js"
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
	availableLanguageTags: readonly T[]
): PathTranslationIssue[] {
	const issues: PathTranslationIssue[] = []
	const expectedLanguages = new Set(availableLanguageTags)

	for (const path in pathTranslations) {
		if (!isValidPath(path)) {
			issues.push({
				path,
				message: "Path must start with a slash.",
			})
			continue
		}

		const expectedParams = getParams(path)

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

			if (!setsEqual(getParams(translatedPath), expectedParams)) {
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

function isValidPath(maybePath: string): maybePath is `/${string}` {
	return maybePath.startsWith("/")
}

function isSubset<T>(a: Set<T>, b: Set<T>): boolean {
	for (const value of a) {
		if (!b.has(value)) return false
	}
	return true
}

function getParams(path: string): Set<string> {
	const semgents = parsePathDefinition(path)
	const params = new Set<string>()
	for (const segment of semgents) {
		if (segment.type === "param") {
			params.add(segment.name)
		}
	}
	return params
}

function setsEqual(a: Set<any>, b: Set<any>): boolean {
	if (a.size !== b.size) return false
	for (const value of a) {
		if (!b.has(value)) return false
	}
	return true
}
