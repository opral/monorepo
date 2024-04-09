import type { ParamMatcher } from "@sveltejs/kit"
import { exec, parse_route_id } from "./routing.js"

export function bestMatch(
	canonicalPath: string,
	pathDefinitions: string[],
	matchers: Record<string, ParamMatcher>
): { params: Record<string, string>; id: string } | undefined {
	let bestMatch:
		| {
				id: string
				params: Record<string, string>
				route: ReturnType<typeof parse_route_id>
		  }
		| undefined = undefined

	for (const pathDefinition of pathDefinitions) {
		const route = parse_route_id(pathDefinition)
		const match = route.pattern.exec(canonicalPath)

		//if the path doesn't match the pattern it's not a match
		if (!match) continue

		//the params are undefined IFF the matchers don't match
		const params = exec(match, route.params, matchers)
		if (!params) continue

		if (!bestMatch) {
			bestMatch = { params, route, id: pathDefinition }
			continue
		}

		const bestMatchNumParams = Object.keys(bestMatch.route.params).length
		const currentMatchNumParams = Object.keys(route.params).length

		// the best match requires fewer parameters
		if (bestMatchNumParams < currentMatchNumParams) {
			continue
		}

		//if the current match has fewer parameters, it's a better match
		if (bestMatchNumParams > currentMatchNumParams) {
			bestMatch = { params, route, id: pathDefinition }
			continue
		}

		// if they're tied, pick the shorter one
		if (
			bestMatchNumParams === currentMatchNumParams &&
			route.pattern.source.length < bestMatch.route.pattern.source.length
		) {
			bestMatch = { params, route, id: pathDefinition }
		}
	}

	return bestMatch
		? {
				id: bestMatch.id,
				params: bestMatch.params,
		  }
		: undefined
}
