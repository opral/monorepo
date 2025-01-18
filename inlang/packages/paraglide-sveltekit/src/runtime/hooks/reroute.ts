import { parseRoute, serializeRoute } from "../utils/route.js"
import { base } from "$app/paths"
import { dev } from "$app/environment"
import type { RoutingStrategy } from "../strategy.js"
import type { Reroute } from "@sveltejs/kit"

/**
 * Returns a reroute function that applies the given translations to the paths
 * @param translations
 */
export const createReroute = <T extends string>(strategy: RoutingStrategy<T>): Reroute => {
	return ({ url }) => {
		try {
			const [localisedPath, dataSuffix] = parseRoute(url.pathname as `/${string}`, base)
			const lang = strategy.getLanguageFromLocalisedPath(localisedPath)
			if (!lang) return url.pathname
			const canonicalPath = strategy.getCanonicalPath(localisedPath, lang)

			return serializeRoute(canonicalPath, base, dataSuffix)
		} catch (e) {
			if (dev) console.error("[@inlang/paraglide-sveltekit] Error thrown during reroute", e)
			return url.pathname
		}
	}
}
