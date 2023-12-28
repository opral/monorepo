import * as NextNavigation from "next/navigation"
import { prefixStrategy } from "./utils"
import {
	availableLanguageTags,
	languageTag,
	sourceLanguageTag,
} from "$paraglide-adapter-next-internal/runtime.js"

const { translateHref } = prefixStrategy(availableLanguageTags, sourceLanguageTag)

type NextUseRouter = (typeof NextNavigation)["useRouter"]
const useRouter: NextUseRouter = (...args) => {
	const nextRouter = NextNavigation.useRouter()

	const push: (typeof nextRouter)["push"] = (href, options) => {
		const translatedHref = translateHref(href, languageTag())
		nextRouter.push(translatedHref, options)
	}

	return {
		...nextRouter,
		push,
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

export * from "next/navigation"
export { useRouter, redirect, permanentRedirect }
