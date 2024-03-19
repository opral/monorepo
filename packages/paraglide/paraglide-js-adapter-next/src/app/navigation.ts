import * as NextNavigation from "next/navigation"
import { setLanguageTag } from "$paraglide/runtime.js"
import { addBasePath, basePath } from "./utils/basePath"
import { RoutingStragey } from "./routing/interface"
import { createLocaliseHref } from "./localiseHref"
import { serializeCookie } from "./utils/cookie"
import { LANG_COOKIE } from "./constants"

export const createNavigation = <T extends string>(
	languageTag: () => T,
	strategy: RoutingStragey<T>
) => {
	const localiseHref = createLocaliseHref(strategy)

	type NextUsePathname = (typeof NextNavigation)["usePathname"]

	/**
	 * Get the current **non-localised** pathname. For example usePathname() on /de/dashboard?foo=bar would return "/dashboard"
	 */
	const usePathname: NextUsePathname = (...args) => {
		const encodedLocalisedPathname = NextNavigation.usePathname(...args)
		const localisedPathname = decodeURI(encodedLocalisedPathname)
		return strategy.getCanonicalPath(localisedPathname, languageTag())
	}

	/**
	 * Get the router methods. For example router.push('/dashboard')
	 */
	const useRouter = () => {
		const nextRouter = NextNavigation.useRouter()
		const localisedCurrentPathname = usePathname()
		const searchParams = NextNavigation.useSearchParams()
		const canonicalCurrentPathname = strategy.getCanonicalPath(
			localisedCurrentPathname,
			languageTag()
		)

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
			const localisedPath = localiseHref(canonicalPath, locale)

			// If the current and new canonical paths are the same, but the language is different,
			// we need to do a native reload to make sure the new language is used
			if (
				canonicalCurrentPathname === canonicalPath &&
				options?.locale &&
				options.locale !== languageTag()
			) {
				let destination = addBasePath(localisedPath, true)
				const searchParamString = searchParams.toString()
				if (searchParamString) {
					destination += `?${searchParamString}`
				}
				history.pushState({}, "", destination)

				document.cookie = serializeCookie({
					...LANG_COOKIE,
					value: locale,
					path: basePath,
				})

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
			const localisedPath = localiseHref(canonicalPath, locale)

			// If the current and new canonical paths are the same, but the language is different,
			// we need to do a native reload to make sure the new language is used
			if (
				canonicalCurrentPathname === canonicalPath &&
				options?.locale &&
				options.locale !== languageTag()
			) {
				let destination = addBasePath(localisedPath, true)
				const searchParamString = searchParams.toString()
				if (searchParamString) {
					destination += `?${searchParamString}`
				}
				history.replaceState({}, "", destination)

				document.cookie = serializeCookie({
					...LANG_COOKIE,
					value: locale,
					path: basePath,
				})

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
			const localisedPath = localiseHref(canonicalPath, locale)
			return nextRouter.prefetch(localisedPath, options)
		}

		return {
			...nextRouter,
			push,
			replace,
			prefetch,
		}
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
	strategy: RoutingStragey<T>
) {
	const localiseHref = createLocaliseHref(strategy)

	type NextRedirect = (typeof NextNavigation)["redirect"]

	/**
	 * When used in a streaming context, this will insert a meta tag to redirect the user to the target page.
	 * When used in a custom app route, it will serve a 307/303 to the caller.
	 *
	 *  @param url the url to redirect to
	 */
	const redirect: NextRedirect = (...args) => {
		args[0] = localiseHref(args[0], languageTag())
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
		args[0] = localiseHref(args[0], languageTag())
		NextNavigation.permanentRedirect(...args)
	}

	return { redirect, permanentRedirect }
}
