import { createNavigation } from "./navigation.base"
import { getLanguage } from "./getLanguage.server"
import { availableLanguageTags, sourceLanguageTag } from "$paraglide/runtime.js"
import { prefixStrategy } from "./routing/prefix"

export const { useRouter, redirect, permanentRedirect, usePathname } = createNavigation(
	getLanguage,
	prefixStrategy({
		availableLanguageTags,
		sourceLanguageTag,
		exclude: [],
	})
)
