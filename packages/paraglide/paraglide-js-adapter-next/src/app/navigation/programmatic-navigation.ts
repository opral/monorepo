import * as NextNavigation from "next/navigation"
import { prefixStrategy } from "../routing/prefix"
import { availableLanguageTags, languageTag, sourceLanguageTag } from "$paraglide/runtime.js"

const { translateHref } = prefixStrategy(availableLanguageTags, sourceLanguageTag)

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

export { useRouter, redirect, permanentRedirect }
