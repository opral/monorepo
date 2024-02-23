import { createNavigation, createRedirects } from "./navigation.base"
import { getLanguage } from "./getLanguage.client"
import { availableLanguageTags, sourceLanguageTag } from "$paraglide/runtime.js"
import { prefixStrategy } from "./routing/prefix"

const strategy = prefixStrategy({
	availableLanguageTags,
	sourceLanguageTag,
	exclude: [],
})

export const { useRouter, usePathname } = createNavigation(getLanguage, strategy)
export const { redirect, permanentRedirect } = createRedirects(getLanguage, strategy)
