import * as NextNavigation from "next/navigation"
import type { RoutingStrategy } from "./routing/prefix"
import { isAvailableLanguageTag } from "$paraglide/runtime.js"

export const createNavigation = <T extends string>(
	languageTag: () => T,
	startegy: RoutingStrategy<T>
) => {
	type NextUseRouter = (typeof NextNavigation)["useRouter"]
	const useRouter: NextUseRouter = (...args) => {
		const nextRouter = NextNavigation.useRouter(...args)

		type NavigateOptions = Parameters<(typeof nextRouter)["push"]>[1]
		type PrefetchOptions = Parameters<(typeof nextRouter)["prefetch"]>[1]

		type OptionalLanguageOption = { locale?: T }

		const push = (
			canonicalPath: string,
			options?: (NavigateOptions & OptionalLanguageOption) | undefined
		) => {
			const locale = options?.locale ?? languageTag()
			const localisedPath = startegy.localiseHref(canonicalPath, locale)
			return nextRouter.push(localisedPath, options)
		}

		const replace = (
			canonicalPath: string,
			options?: (NavigateOptions & OptionalLanguageOption) | undefined
		) => {
			const locale = options?.locale ?? languageTag()
			const localisedPath = startegy.localiseHref(canonicalPath, locale)
			return nextRouter.replace(localisedPath, options)
		}

		const prefetch = (canonicalPath: string, options: PrefetchOptions & OptionalLanguageOption) => {
			const locale = options?.locale ?? languageTag()
			const localisedPath = startegy.localiseHref(canonicalPath, locale)
			return nextRouter.prefetch(localisedPath, options)
		}

		return {
			...nextRouter,
			push,
			replace,
			prefetch,
		}
	}
	type NextUsePathname = (typeof NextNavigation)["usePathname"]

	/**
	 * Get the current **non-localised** pathname. For example usePathname() on /de/dashboard?foo=bar would return "/dashboard"
	 */
	const usePathname: NextUsePathname = (...args) => {
		const localisedPathname = NextNavigation.usePathname(...args)
		const segments = localisedPathname.split("/").filter(Boolean)
		const languageTag = segments[0]
		if (!isAvailableLanguageTag(languageTag)) {
			return localisedPathname
		}
		return "/" + segments.slice(1).join("/")
	}

	return { useRouter, usePathname }
}

/**
 * Implements the same API as NextNavigation, but throws an error when used.
 * Usefull for poisoning the client-side navigation hooks on the server.
 */
export function createNoopNavigation(): ReturnType<typeof createNavigation> {
	return {
		usePathname: () => {
			throw new Error("usePathname is not available on the server")
		},
		useRouter: () => {
			throw new Error("useRouter is not available on the server")
		},
	}
}

export function createRedirects<T extends string>(
	languageTag: () => T,
	startegy: RoutingStrategy<T>
) {
	type NextRedirect = (typeof NextNavigation)["redirect"]
	const redirect: NextRedirect = (...args) => {
		args[0] = startegy.localiseHref(args[0], languageTag())
		NextNavigation.redirect(...args)
	}

	type NextPermanentRedirect = (typeof NextNavigation)["permanentRedirect"]
	const permanentRedirect: NextPermanentRedirect = (...args) => {
		args[0] = startegy.localiseHref(args[0], languageTag())
		NextNavigation.permanentRedirect(...args)
	}

	return { redirect, permanentRedirect }
}
