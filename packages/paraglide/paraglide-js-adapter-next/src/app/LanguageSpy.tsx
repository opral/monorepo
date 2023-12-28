"use client"

import {
	availableLanguageTags,
	sourceLanguageTag,
} from "$paraglide-adapter-next-internal/runtime.js"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { prefixStrategy } from "./navigation/utils"

const { getLocaleFromPath } = prefixStrategy(availableLanguageTags, sourceLanguageTag)

//Keep track of the language in the pathname, and reload the page when it changes
export function LangaugeSpy() {
	const router = useRouter()
	const pathname = usePathname()

	const language = getLocaleFromPath(pathname) ?? sourceLanguageTag
	const [currentLanguage, setCurrentLanguage] = useState(language)

	useEffect(() => {
		if (currentLanguage !== language) {
			setCurrentLanguage(language)
			router.refresh()
		}
	}, [pathname])

	return null
}
