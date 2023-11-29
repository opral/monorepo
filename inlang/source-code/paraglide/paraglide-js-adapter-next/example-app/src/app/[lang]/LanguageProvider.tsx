"use client"
import { AvailableLanguageTag, onSetLanguageTag } from "@/paraglide/runtime"
import { createContext, useState, type ReactNode } from "react"

const LanguageContext = createContext("en")

export function LanguageProvider({ children }: { children: ReactNode }): JSX.Element {
	const [lang, setLang] = useState<AvailableLanguageTag>("en")
	onSetLanguageTag(setLang)

	return <LanguageContext.Provider value={lang}>{children}</LanguageContext.Provider>
}
