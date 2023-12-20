"use client"

import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

//Keep track of the language in the pathname, and reload the page when it changes
export function LangaugeSpy() {
	const router = useRouter()
	const pathname = usePathname()
	const language = pathname.split("/")[1]
	const [currentLanguage, setCurrentLanguage] = useState(language)

	useEffect(() => {
		if (currentLanguage !== language) {
			console.log("Language changed to", language)
			setCurrentLanguage(language)
			router.refresh()
		}
	}, [pathname])

	return null
}
