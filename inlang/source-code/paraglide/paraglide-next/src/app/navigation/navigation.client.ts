import * as NextNavigation from "next/navigation"
import { languageTag, setLanguageTag } from "$paraglide/runtime.js"
import { addBasePath, basePath } from "../utils/basePath"
import type { RoutingStrategy } from "../routing-strategy/interface"
import { createLocaliseHref } from "../localiseHref"
import { serializeCookie } from "../utils/cookie"
import { LANG_COOKIE } from "../constants"
import { createRedirects } from "./redirect"
import { createLink } from "./Link"

export type LocalisedNavigation<T extends string> = ReturnType<typeof Navigation<T>>

export const Navigation = <T extends string>({ strategy }: { strategy: RoutingStrategy<T> }) => {
	const localiseHref = createLocaliseHref(strategy)

	/**
	 * Get the current **non-localised** pathname. For example usePathname() on /de/dashboard?foo=bar would return "/dashboard"
	 */
	const usePathname = (): `/${string}` => {
		const encodedLocalisedPathname = NextNavigation.usePathname()
		const localisedPathname = decodeURI(encodedLocalisedPathname) as `/${string}`
		return strategy.getCanonicalPath(localisedPathname, languageTag() as T)
	}

	/**s
	 * Get the router methods. For example router.push('/dashboard')
	 */
	const useRouter = () => {
		const nextRouter = NextNavigation.useRouter()
		const searchParams = NextNavigation.useSearchParams()
		const canonicalCurrentPathname = usePathname()

		type NavigateOptions = Parameters<(typeof nextRouter)["push"]>[1]
		type PrefetchOptions = Parameters<(typeof nextRouter)["prefetch"]>[1]

		type OptionalLanguageOption = { locale?: T }

		/**
		 * Navigate to the provided href. Pushes a new history entry.
		 */
		const push = (
			canonicalDestinationPath: string,
			options?: (NavigateOptions & OptionalLanguageOption) | undefined
		) => {
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
		}

		/**
		 * Navigate to the provided href. Replaces the current history entry.
		 */
		const replace = (
			canonicalDestinationPath: string,
			options?: (NavigateOptions & OptionalLanguageOption) | undefined
		) => {
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
		}

		/**
		 * Prefetch the provided href.
		 */
		const prefetch = (
			canonicalDestinationPath: string,
			options: PrefetchOptions & OptionalLanguageOption
		) => {
			const locale = options?.locale ?? (languageTag() as T)
			const isLanguageSwitch = locale !== languageTag()
			const localisedPath = localiseHref(canonicalDestinationPath, locale, "/", isLanguageSwitch)
			return nextRouter.prefetch(localisedPath, options)
		}

		return {
			...nextRouter,
			push,
			replace,
			prefetch,
		}
	}

	return {
		useRouter,
		usePathname,
		...createRedirects(languageTag, strategy),
		Link: createLink(strategy),
	}
}
