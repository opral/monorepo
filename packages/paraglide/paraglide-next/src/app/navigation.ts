import * as NextNavigation from "next/navigation"
import { setLanguageTag } from "$paraglide/runtime.js"
import { addBasePath, basePath } from "./utils/basePath"
import { RoutingStragey } from "./routing/interface"
import { createLocaliseHref } from "./localiseHref"
import { serializeCookie } from "./utils/cookie"
import { LANG_COOKIE } from "./constants"
import { rsc } from "rsc-env"
import { createLink } from "./Link"
import { ResolvedI18nConfig } from "./config"

export const createNavigation = <T extends string>({
	languageTag,
	strategy,
	config,
}: {
	languageTag: () => T
	strategy: RoutingStragey<T>
	config: ResolvedI18nConfig<T>
}) => {
	const routing = rsc ? createNoopRouting() : createRouting(languageTag, strategy)
	const redirects = createRedirects(languageTag, strategy)
	const Link = createLink(languageTag, config.defaultLanguage, strategy)

	return {
		...routing,
		...redirects,
		Link,
	}
}

export const createRouting = <T extends string>(
	languageTag: () => T,
	strategy: RoutingStragey<T>
) => {
	const localiseHref = createLocaliseHref(strategy)

	type NextUsePathname = (typeof NextNavigation)["usePathname"]

	/**
	 * Get the current canonical pathname.
	 * @example
	 * ```ts
	 * // on https://example.com/de/dashboard?foo=bar
	 * usePathname() // "/dashboard"
	 * ```
	 */
	const usePathname: NextUsePathname = (...args) => {
		const encodedLocalisedPathname = NextNavigation.usePathname(...args)
		const localisedPathname = decodeURI(encodedLocalisedPathname)
		return strategy.getCanonicalPath(localisedPathname, languageTag())
	}

	/**
	 * Get wrapped router methods so you can interact with them using canonical paths
	 * @example
	 * ```ts
	 * // on https://example.com/de
	 * useRouter().push("/about") // Pushes "/de/ueber-uns"
	 * ```
	 */
	const useRouter = () => {
		const nextRouter = NextNavigation.useRouter()
		const currentCanonicalPathname = usePathname()
		const searchParams = NextNavigation.useSearchParams()
		const canonicalCurrentPathname = strategy.getCanonicalPath(
			currentCanonicalPathname,
			languageTag()
		)

		type NavigateOptions = Parameters<(typeof nextRouter)["push"]>[1]
		type PrefetchOptions = Parameters<(typeof nextRouter)["prefetch"]>[1]

		type OptionalLanguageOption = { locale?: T }

		/**
		 * Navigate to the provided href. Pushes a new history entry.
		 * @example
		 * ```ts
		 * // on https://example.com/de
		 * useRouter().push("/about") // Pushes "/de/ueber-uns"
		 * ```
		 */
		const push = (
			canonicalPath: string,
			options?: (NavigateOptions & OptionalLanguageOption) | undefined
		) => {
			const locale = options?.locale ?? languageTag()
			const localisedPath = localiseHref(
				canonicalPath,
				locale,
				currentCanonicalPathname,
				locale !== languageTag()
			)

			// If the current and new canonical paths are the same, but the language is different,
			// we need to do a native reload to make sure the new language is used
			if (
				canonicalCurrentPathname === canonicalPath &&
				options?.locale &&
				options.locale !== languageTag()
			) {
				const searchParamString = searchParams.toString()
				const destination = searchParamString
					? addBasePath(localisedPath, true) + `?${searchParamString}`
					: addBasePath(localisedPath, true)

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
		 *
		 * @example
		 * ```ts
		 * // on https://example.com/de
		 * useRouter().replace("/about") // Replaces entry with "/de/ueber-uns"
		 * ```
		 */
		const replace = (
			canonicalPath: string,
			options?: (NavigateOptions & OptionalLanguageOption) | undefined
		) => {
			const locale = options?.locale ?? languageTag()
			const localisedPath = localiseHref(
				canonicalPath,
				locale,
				currentCanonicalPathname,
				locale !== languageTag()
			)

			// If the current and new canonical paths are the same, but the language is different,
			// we need to do a native reload to make sure the new language is used
			if (
				canonicalCurrentPathname === canonicalPath &&
				options?.locale &&
				options.locale !== languageTag()
			) {
				const searchParamString = searchParams.toString()
				const destination = searchParamString
					? addBasePath(localisedPath, true) + `?${searchParamString}`
					: addBasePath(localisedPath, true)

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
		 *
		 * @example
		 * ```ts
		 * // on https://example.com/de
		 * useRouter().prefetch("/about") // Prefetches data for "/de/ueber-uns"
		 * ```
		 */
		const prefetch = (canonicalPath: string, options: PrefetchOptions & OptionalLanguageOption) => {
			const locale = options?.locale ?? languageTag()
			const localisedPath = localiseHref(
				canonicalPath,
				locale,
				currentCanonicalPathname,
				locale !== languageTag()
			)
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
export function createNoopRouting<T extends string>(): ReturnType<typeof createRouting<T>> {
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
		const href = args[0]

		if (process.env.NODE_ENV === "development" && !href.startsWith("/")) {
			throw new Error("The href passed to redirect cannot be relative")
		}

		args[0] = localiseHref(href, languageTag(), "/", false)
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
		const href = args[0]
		if (process.env.NODE_ENV === "development" && !href.startsWith("/")) {
			throw new Error("The href passed to permanentRedirect cannot be relative")
		}

		args[0] = localiseHref(href, languageTag(), "/", false)
		NextNavigation.permanentRedirect(...args)
	}

	return { redirect, permanentRedirect }
}
