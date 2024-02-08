import { parsePathDefinition } from "../path-translations/matching/parse.js"
import type { PathTranslations } from "./pathTranslations.js"

export type PathTranslationIssue = {
	path: string
	message: string
}

export function validatePathTranslations<T extends string>(
	pathTranslations: PathTranslations<T>
): PathTranslationIssue[] {
	const issues: PathTranslationIssue[] = []

	for (const path in pathTranslations) {
		if (path[0] !== "/") {
			issues.push({
				path,
				message: "Path must start with a slash.",
			})
			continue
		}

		const params = parsePathDefinition(path)
		const expectedParams = new Set<string>()
		for (const param of params) {
			if (param.type === "param") {
				expectedParams.add(param.name)
			}
		}

		//@ts-ignore
		const translations = pathTranslations[path]

		const languages = new Set(...Object.keys(translations))
		const expectedLanguages = new Set(...Object.keys(translations))

		if (!setsEqual(expectedLanguages, languages)) {
			issues.push({
				path,
				message: "Not all languages are translated.",
			})
			continue
		}
	}

	return issues
}

function setsEqual(a: Set<any>, b: Set<any>): boolean {
	if (a.size !== b.size) return false
	for (const value of a) {
		if (!b.has(value)) return false
	}
	return true
}
