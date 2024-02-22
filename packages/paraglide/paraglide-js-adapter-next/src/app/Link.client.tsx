import { availableLanguageTags, sourceLanguageTag } from "$paraglide/runtime.js"
import { createLink } from "./Link.base"
import { getLanguage } from "./getLanguage.client"
import { prefixStrategy } from "./routing/prefix"

export const Link = createLink(
	getLanguage,
	prefixStrategy({
		availableLanguageTags,
		sourceLanguageTag,
		exclude: [],
	})
)
