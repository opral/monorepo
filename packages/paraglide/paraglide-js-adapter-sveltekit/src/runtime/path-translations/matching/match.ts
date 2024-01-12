import { parsePathDefinition } from "./parse.js"

type MatchResult = { matches: false } | { matches: true; params: Record<string, string> }

const NO_MATCH: MatchResult = { matches: false }

export function matches(canonicalPath: string, pathDefinition: string): MatchResult {
	const segments = canonicalPath.split("/").filter(Boolean)
	const parts = parsePathDefinition(pathDefinition)

	const params: Record<string, string> = {}

	let i = 0
	for (const part of parts) {
		const segment = segments[i]
		if (!segment) return NO_MATCH

		if (part.type === "static") {
			if (part.value !== segment) {
				return NO_MATCH
			}
		} else if (part.type === "param") {
			if (part.optional) throw new Error("Optional params are not supported yet")
			if (part.catchAll) throw new Error("Catchall params are not supported yet")

			params[part.name] = segment
		}
		i++
	}

	if (i !== segments.length) return NO_MATCH

	return { matches: true, params }
}
