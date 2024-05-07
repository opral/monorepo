import type { LocalisedNavigation } from "./navigation.client"
import type { RoutingStrategy } from "../routing-strategy/interface"
import { createRedirects } from "./redirect"
import { languageTag } from "$paraglide/runtime.js"
import { createLink } from "./Link"

/**
 * Implements the same API as NextNavigation, but throws an error when used.
 * Usefull for poisoning the client-side navigation hooks on the server.
 */
export function Navigation<T extends string>({
	strategy,
}: {
	strategy: RoutingStrategy<T>
}): LocalisedNavigation<T> {
	return {
		usePathname: () => {
			throw new Error("usePathname is not available on the server")
		},
		useRouter: () => {
			throw new Error("useRouter is not available on the server")
		},
		...createRedirects(languageTag, strategy),
		Link: createLink(strategy),
	}
}
