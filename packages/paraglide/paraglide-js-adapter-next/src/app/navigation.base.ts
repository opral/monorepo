import * as NextNavigation from "next/navigation"
import { prefixStrategy } from "./routing/prefix"
import {
	availableLanguageTags,
	isAvailableLanguageTag,
	sourceLanguageTag,
} from "$paraglide/runtime.js"

const { translateHref } = prefixStrategy(availableLanguageTags, sourceLanguageTag)

export const createNavigation = (languageTag: () => string) => {
	type NextUseRouter = (typeof NextNavigation)["useRouter"]
	const useRouter: NextUseRouter = (...args) => {
		const nextRouter = NextNavigation.useRouter(...args)

		const push: (typeof nextRouter)["push"] = (...args) => {
			args[0] = translateHref(args[0], languageTag())
			nextRouter.push(...args)
		}

		const replace: (typeof nextRouter)["replace"] = (...args) => {
			args[0] = translateHref(args[0], languageTag())
			nextRouter.replace(...args)
		}

		const prefetch: (typeof nextRouter)["prefetch"] = (...args) => {
			args[0] = translateHref(args[0], languageTag())
			nextRouter.prefetch(...args)
		}

		return {
			...nextRouter,
			push,
			replace,
			prefetch,
		}
	}

	type NextRedirect = (typeof NextNavigation)["redirect"]
	const redirect: NextRedirect = (...args) => {
		args[0] = translateHref(args[0], languageTag())
		NextNavigation.redirect(...args)
	}

	type NextPermanentRedirect = (typeof NextNavigation)["permanentRedirect"]
	const permanentRedirect: NextPermanentRedirect = (...args) => {
		args[0] = translateHref(args[0], languageTag())
		NextNavigation.permanentRedirect(...args)
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

	return { useRouter, redirect, permanentRedirect, usePathname }
}
