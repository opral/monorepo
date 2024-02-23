"use client"
import { availableLanguageTags, sourceLanguageTag } from "$paraglide/runtime.js"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { prefixStrategy } from "../routing/prefix"

const { getLocaleFromLocalisedPath } = prefixStrategy({
	availableLanguageTags,
	sourceLanguageTag,
	exclude: [],
})

/**
 * This component keeps track of the language in the URL and refreshes the page when it changes.
 */
export function LanguageSpy() {
	const router = useRouter()
	const pathname = usePathname()

	const language = getLocaleFromLocalisedPath(pathname) ?? sourceLanguageTag
	const [currentLanguage, setCurrentLanguage] = useState(language)

	useEffect(() => {
		if (currentLanguage !== language) {
			setCurrentLanguage(language)
			router.refresh()
		}
	}, [pathname])

	return undefined
}
