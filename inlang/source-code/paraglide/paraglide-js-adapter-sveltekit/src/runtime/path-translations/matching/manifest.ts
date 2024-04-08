import type { RouteParam } from "@sveltejs/kit"
import { parse_route_id } from "./routing.js"

export type RouteManifest = Array<{
	id: string
	params: RouteParam[]
	pattern: RegExp
}>

/**
 * Creates a route-manifest.
 * A route-manigest is an array of precompiled routes that are ordered in descending specificity.
 *
 * @param routeIds
 */
export function createManifest(routeIds: string[]): RouteManifest {
	const routes = routeIds.map((routeId) => ({ ...parse_route_id(routeId), id: routeId }))
	routes.toSorted((a, b) => b.pattern.source.length - a.pattern.source.length)
	return routes
}

function compareSpecificity(
	routeA: RouteManifest[number],
	routeB: RouteManifest[number]
): -1 | 0 | 1 {
	//The one with fewer params wins
	return routeA.params.length - routeB.params.length

	//The one with more segments wins
	const aSegments = routeA.id.split("/").length
}
