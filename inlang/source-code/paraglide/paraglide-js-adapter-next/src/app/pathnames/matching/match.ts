import { parsePathDefinition } from "./parse.js"

type MatchResult = { id: string; params: Record<string, string> }

export function matches(canonicalPath: string, pathDefinitions: string[]): MatchResult | undefined {
	let bestMatch: MatchResult | undefined = undefined

	outer: for (const pathDefinition of pathDefinitions) {
		const parts = parsePathDefinition(pathDefinition)
		const params: Record<string, string> = {}

		let currentIndex = 0
		for (const part of parts) {
			if (part.type === "static") {
				if (part.value !== canonicalPath.slice(currentIndex, currentIndex + part.value.length)) {
					continue outer
				} else {
					currentIndex += part.value.length
				}
			} else if (part.type === "param") {
				let nextSlashIndex = canonicalPath.indexOf("/", currentIndex)
				if (nextSlashIndex === -1) nextSlashIndex = canonicalPath.length
				params[part.name] = canonicalPath.slice(currentIndex, nextSlashIndex)
				currentIndex = nextSlashIndex
			}
		}

		if (currentIndex !== canonicalPath.length) continue
		const match = { id: pathDefinition, params }

		if (!bestMatch) {
			bestMatch = match
			continue
		}

		const bestMatchParams = Object.keys(bestMatch.params).length
		const matchParams = Object.keys(params).length

		if (bestMatchParams < matchParams) continue
		if (bestMatchParams === matchParams) {
			if (bestMatch.id.length > pathDefinition.length) bestMatch = match
		} else {
			bestMatch = match
		}
	}

	return bestMatch
}
