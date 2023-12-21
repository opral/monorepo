"use client"

import { isAvailableLanguageTag, sourceLanguageTag } from "@/paraglide/runtime"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

//Keep track of the language in the pathname, and reload the page when it changes
export function LangaugeSpy() {
	const router = useRouter()
	const pathname = usePathname()
	const maybeLanguage = pathname.split("/")[1]
	const language = isAvailableLanguageTag(maybeLanguage) ? maybeLanguage : sourceLanguageTag
	const [currentLanguage, setCurrentLanguage] = useState(language)

	useEffect(() => {
		if (currentLanguage !== language) {
			setCurrentLanguage(language)
			router.refresh()
		}
	}, [pathname])

	return null
}
