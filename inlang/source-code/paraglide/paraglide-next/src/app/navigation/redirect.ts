import { localizeHref } from "../localiseHref"
import {
	redirect as NextRedirect,
	permanentRedirect as NextPermanentRedirect,
} from "next/navigation"
import type { RoutingStrategy } from "../routing-strategy/interface"

export function createRedirects<T extends string>(
	languageTag: () => T,
	strategy: RoutingStrategy<T>
) {
	/**
	 * When used in a streaming context, this will insert a meta tag to redirect the user to the target page.
	 * When used in a custom app route, it will serve a 307/303 to the caller.
	 *
	 *  @param url the url to redirect to
	 */
	const redirect: typeof NextRedirect = (href, ...other) => {
		href = localizeHref(strategy, href, languageTag(), "/", false)
		NextRedirect(href, ...other)
	}

	/**
	 * When used in a streaming context, this will insert a meta tag to redirect the user to the target page.
	 * When used in a custom app route, it will serve a 308/303 to the caller.
	 *
	 * @param url the url to redirect to
	 */
	const permanentRedirect: typeof NextPermanentRedirect = (href, ...other) => {
		href = localizeHref(strategy, href, languageTag(), "/", false)
		NextPermanentRedirect(href, ...other)
	}

	return { redirect, permanentRedirect }
}
