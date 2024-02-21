import * as NextNavigation from "next/navigation"
import { prefixStrategy } from "./routing/prefix"
import { availableLanguageTags, sourceLanguageTag } from "$paraglide/runtime.js"
import { getLanguage } from "./getLanguage.server"

const { translateHref } = prefixStrategy(availableLanguageTags, sourceLanguageTag)

type NextUseRouter = (typeof NextNavigation)["useRouter"]

/**
 * Get the router methods. For example router.push('/dashboard')
 */
const useRouter: NextUseRouter = (...args) => {
	const nextRouter = NextNavigation.useRouter(...args)

	/**
	 * Navigate to the provided href. Pushes a new history entry.
	 */
	const push: (typeof nextRouter)["push"] = (...args) => {
		args[0] = translateHref(args[0], getLanguage())
		nextRouter.push(...args)
	}

	/**
	 * Navigate to the provided href. Replaces the current history entry.
	 */
	const replace: (typeof nextRouter)["replace"] = (...args) => {
		args[0] = translateHref(args[0], getLanguage())
		nextRouter.replace(...args)
	}

	/**
	 * Prefetch the provided href.
	 */
	const prefetch: (typeof nextRouter)["prefetch"] = (...args) => {
		args[0] = translateHref(args[0], getLanguage())
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

/**
 * When used in a streaming context, this will insert a meta tag to redirect the user to the target page. When used in a custom app route, it will serve a 307 to the caller.
 * @param url — the url to redirect to
 */
const redirect: NextRedirect = (...args) => {
	args[0] = translateHref(args[0], getLanguage())
	NextNavigation.redirect(...args)
}

type NextPermanentRedirect = (typeof NextNavigation)["permanentRedirect"]

/**
 * When used in a streaming context, this will insert a meta tag to redirect the user to the target page. When used in a custom app route, it will serve a 308 to the caller.
 * @param url — the url to redirect to
 */
const permanentRedirect: NextPermanentRedirect = (...args) => {
	args[0] = translateHref(args[0], getLanguage())
	NextNavigation.permanentRedirect(...args)
}

export { useRouter, redirect, permanentRedirect }
