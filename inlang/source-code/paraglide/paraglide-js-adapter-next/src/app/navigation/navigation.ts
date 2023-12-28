export * from "next/navigation"
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { useRouter as useNextRouter } from "next/navigation"
import { prefixStrategy } from "./utils"
import {
	availableLanguageTags,
	languageTag,
	sourceLanguageTag,
} from "$paraglide-adapter-next-internal/runtime.js"

const { translateHref } = prefixStrategy(availableLanguageTags, sourceLanguageTag)

const useRouter = (): AppRouterInstance => {
	const nextRouter = useNextRouter()

	const push: (typeof nextRouter)["push"] = (href, options) => {
		const translatedHref = translateHref(href, languageTag())
		nextRouter.push(translatedHref, options)
	}

	return {
		...nextRouter,
		push,
	}
}
export { useRouter }
