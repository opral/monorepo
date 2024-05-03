import type { LocalisedNavigation } from "./navigation.client"
import type { RoutingStragey } from "../routing-strategy/interface"
import { createRedirects } from "./redirect"
import { languageTag } from "$paraglide/runtime.js"
import { createLink } from "./Link"

/**
 * Implements the same API as NextNavigation, but throws an error when used.
 * Usefull for poisoning the client-side navigation hooks on the server.
 */
export function createNavigation<T extends string>({
	strategy,
}: {
	strategy: RoutingStragey<T>
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
