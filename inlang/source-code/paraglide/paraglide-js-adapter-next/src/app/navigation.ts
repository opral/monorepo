import * as NextNavigation from "next/navigation"
import type { RoutingStrategy } from "./routing/prefix"
import { setLanguageTag } from "$paraglide/runtime.js"
import { addBasePath } from "./routing/basePath"

export const createNavigation = <T extends string>(
	languageTag: () => T,
	startegy: RoutingStrategy<T>
) => {
	/**
	 * Get the router methods. For example router.push('/dashboard')
	 */
	const useRouter = () => {
		const nextRouter = NextNavigation.useRouter()
		const localisedCurrentPathname = NextNavigation.usePathname()
		const canonicalCurrentPathname = startegy.getCanonicalPath(localisedCurrentPathname)

		type NavigateOptions = Parameters<(typeof nextRouter)["push"]>[1]
		type PrefetchOptions = Parameters<(typeof nextRouter)["prefetch"]>[1]

		type OptionalLanguageOption = { locale?: T }

		/**
		 * Navigate to the provided href. Pushes a new history entry.
		 */
		const push = (
			canonicalPath: string,
			options?: (NavigateOptions & OptionalLanguageOption) | undefined
		) => {
			const locale = options?.locale ?? languageTag()
			const localisedPath = startegy.localiseHref(canonicalPath, locale)

			// If the current and new canonical paths are the same, but the language is different,
			// we need to do a native reload to make sure the new language is used
			if (
				canonicalCurrentPathname === canonicalPath &&
				options?.locale &&
				options.locale !== languageTag()
			) {
				history.pushState({}, "", addBasePath(localisedPath, true))
				window.location.reload()
				return
			}

			if (options?.locale) {
				//Make sure to render new client components with the new language
				setLanguageTag(options.locale)
			}

			return nextRouter.push(localisedPath, options)
		}

		/**
		 * Navigate to the provided href. Replaces the current history entry.
		 */
		const replace = (
			canonicalPath: string,
			options?: (NavigateOptions & OptionalLanguageOption) | undefined
		) => {
			const locale = options?.locale ?? languageTag()
			const localisedPath = startegy.localiseHref(canonicalPath, locale)

			// If the current and new canonical paths are the same, but the language is different,
			// we need to do a native reload to make sure the new language is used
			if (
				canonicalCurrentPathname === canonicalPath &&
				options?.locale &&
				options.locale !== languageTag()
			) {
				history.replaceState({}, "", addBasePath(localisedPath, true))
				window.location.reload()
				return
			}

			if (options?.locale) {
				//Make sure to render new client components with the new language
				setLanguageTag(options.locale)
			}

			return nextRouter.replace(localisedPath, options)
		}

		/**
		 * Prefetch the provided href.
		 */
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
		return startegy.getCanonicalPath(localisedPathname)
	}

	return { useRouter, usePathname }
}

/**
 * Implements the same API as NextNavigation, but throws an error when used.
 * Usefull for poisoning the client-side navigation hooks on the server.
 */
export function createNoopNavigation<T extends string>(): ReturnType<typeof createNavigation<T>> {
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

	/**
	 * When used in a streaming context, this will insert a meta tag to redirect the user to the target page.
	 * When used in a custom app route, it will serve a 307/303 to the caller.
	 *
	 *  @param url the url to redirect to
	 */
	const redirect: NextRedirect = (...args) => {
		args[0] = startegy.localiseHref(args[0], languageTag())
		NextNavigation.redirect(...args)
	}

	type NextPermanentRedirect = (typeof NextNavigation)["permanentRedirect"]

	/**
	 * When used in a streaming context, this will insert a meta tag to redirect the user to the target page.
	 * When used in a custom app route, it will serve a 308/303 to the caller.
	 *
	 * @param url the url to redirect to
	 */
	const permanentRedirect: NextPermanentRedirect = (...args) => {
		args[0] = startegy.localiseHref(args[0], languageTag())
		NextNavigation.permanentRedirect(...args)
	}

	return { redirect, permanentRedirect }
}
