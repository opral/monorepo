import * as NextNavigation from "next/navigation"
import { languageTag, setLanguageTag } from "$paraglide/runtime.js"
import { addBasePath, basePath } from "../utils/basePath"
import { createLocaliseHref } from "../localiseHref"
import { serializeCookie } from "../utils/cookie"
import { LANG_COOKIE } from "../constants"
import { createRedirects, LocalizedPermanentRedirect, LocalizedRedirect } from "./redirect"
import { createLink, LocalizedLink } from "./Link"
import type { RoutingStrategy } from "../routing-strategy/interface"

export type LocalisedNavigation<T extends string> = {
	Link: LocalizedLink<T>
	usePathname: LocalizedUsePathname
	redirect: LocalizedRedirect
	permanentRedirect: LocalizedPermanentRedirect
	useRouter: LocalizedUseRouter<T>
}

export const Navigation = <T extends string>({
	strategy,
}: {
	strategy: RoutingStrategy<T>
}): LocalisedNavigation<T> => {
	const Link = createLink(strategy)
	const usePathname = createUsePathname(strategy)
	const { redirect, permanentRedirect } = createRedirects(languageTag, strategy)
	const useRouter = createUseRouter(strategy, usePathname)

	return {
		useRouter,
		usePathname,
		redirect,
		permanentRedirect,
		Link,
	}
}

type LocalizedUsePathname = () => `/${string}`
/**
 * Creates a `usePathname` function that returns the current _canonical_ path.
 * Next's built-in one would return the current _localised_ path.
 */
function createUsePathname<T extends string>(strategy: RoutingStrategy<T>): LocalizedUsePathname {
	return (): `/${string}` => {
		const encodedLocalisedPathname = NextNavigation.usePathname()
		const localisedPathname = decodeURI(encodedLocalisedPathname) as `/${string}`
		return strategy.getCanonicalPath(localisedPathname, languageTag() as T)
	}
}

type AppRouterInstance = ReturnType<typeof import("next/navigation").useRouter>
type LocalizedUseRouter<T extends string> = () => Omit<
	AppRouterInstance,
	"push" | "replace" | "prefetch"
> & {
	push: (
		canonicalDestinationPath: Parameters<AppRouterInstance["push"]>[0], // using the parameter is important for typedRoutes
		options?: (Parameters<AppRouterInstance["push"]>[1] & { locale?: T }) | undefined
	) => ReturnType<AppRouterInstance["push"]>
	replace: (
		canonicalDestinationPath: Parameters<AppRouterInstance["replace"]>[0], // using the parameter is important for typedRoutes
		options?: (Parameters<AppRouterInstance["replace"]>[1] & { locale?: T }) | undefined
	) => ReturnType<AppRouterInstance["replace"]>
	prefetch: (
		canonicalDestinationPath: Parameters<AppRouterInstance["prefetch"]>[0], // using the parameter is important for typedRoutes
		options?: (Parameters<AppRouterInstance["prefetch"]>[1] & { locale?: T }) | undefined
	) => ReturnType<AppRouterInstance["prefetch"]>
}

function createUseRouter<T extends string>(
	strategy: RoutingStrategy<T>,
	usePathname: LocalizedUsePathname
): LocalizedUseRouter<T> {
	return () => {
		const localiseHref = createLocaliseHref(strategy)
		const nextRouter = NextNavigation.useRouter()
		const searchParams = NextNavigation.useSearchParams()
		const canonicalCurrentPathname = usePathname()

		return {
			...nextRouter,
			/**
			 * Navigate to the provided href. Pushes a new history entry.
			 */
			push: (canonicalDestinationPath, options) => {
				const locale = options?.locale ?? (languageTag() as T)
				const isLanguageSwitch = locale !== languageTag()

				const localisedPath = localiseHref(
					canonicalDestinationPath,
					locale,
					canonicalCurrentPathname,
					isLanguageSwitch
				)

				// If the current and new canonical paths are the same, but the language is different,
				// we need to do a native reload to make sure the new language is used
				if (canonicalCurrentPathname === canonicalDestinationPath && isLanguageSwitch) {
					let destination = addBasePath(localisedPath, true)
					const searchParamString = searchParams.toString()
					if (searchParamString) {
						destination += `?${searchParamString}`
					}
					history.pushState({}, "", destination)

					document.cookie = serializeCookie({
						...LANG_COOKIE,
						value: locale,
						Path: basePath ?? "/",
					})

					window.location.reload()
					return
				}

				if (options?.locale) {
					//Make sure to render new client components with the new language
					setLanguageTag(options.locale)
				}

				return nextRouter.push(localisedPath, options)
			},
			/**
			 * Navigate to the provided href. Replaces the current history entry.
			 */
			replace: (canonicalDestinationPath, options) => {
				const locale = options?.locale ?? (languageTag() as T)
				const isLanguageSwitch = locale !== languageTag()
				const localisedPath = localiseHref(
					canonicalDestinationPath,
					locale,
					canonicalCurrentPathname,
					isLanguageSwitch
				)

				// If the current and new canonical paths are the same, but the language is different,
				// we need to do a native reload to make sure the new language is used
				if (canonicalCurrentPathname === canonicalDestinationPath && isLanguageSwitch) {
					let destination = addBasePath(localisedPath, true)
					const searchParamString = searchParams.toString()
					if (searchParamString) {
						destination += `?${searchParamString}`
					}
					history.replaceState({}, "", destination)

					document.cookie = serializeCookie({
						...LANG_COOKIE,
						value: locale,
						Path: basePath ?? "/",
					})

					window.location.reload()
					return
				}

				if (options?.locale) {
					//Make sure to render new client components with the new language
					setLanguageTag(options.locale)
				}

				return nextRouter.replace(localisedPath, options)
			},
			/**
			 * Prefetch the provided href.
			 */
			prefetch: (canonicalDestinationPath, options) => {
				const locale = options?.locale ?? (languageTag() as T)
				const isLanguageSwitch = locale !== languageTag()
				const localisedPath = localiseHref(canonicalDestinationPath, locale, "/", isLanguageSwitch)
				return nextRouter.prefetch(localisedPath, options)
			},
		}
	}
}
