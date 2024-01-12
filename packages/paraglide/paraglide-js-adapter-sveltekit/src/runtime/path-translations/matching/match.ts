import { parsePathDefinition } from "./parse.js"

type MatchResult = { id: string; params: Record<string, string> }

export function matches(canonicalPath: string, pathDefinitions: string[]): MatchResult | undefined {
	const segments = canonicalPath.split("/").filter(Boolean)

	let bestMatch: MatchResult | undefined = undefined

	outer: for (const pathDefinition of pathDefinitions) {
		const parts = parsePathDefinition(pathDefinition)
		const params: Record<string, string> = {}

		let i = 0
		for (const part of parts) {
			const segment = segments[i]
			if (!segment) continue

			if (part.type === "static") {
				if (part.value !== segment) {
					continue outer
				}
			} else if (part.type === "param") {
				if (part.optional) throw new Error("Optional params are not supported yet")
				if (part.catchAll) throw new Error("Catchall params are not supported yet")

				params[part.name] = segment
			}
			i++
		}

		if (segments.length !== parts.length) continue
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
