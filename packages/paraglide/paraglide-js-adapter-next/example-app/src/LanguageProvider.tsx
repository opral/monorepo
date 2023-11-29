"use client"
import { AvailableLanguageTag, setLanguageTag } from "@/paraglide/runtime"
import type { ReactNode } from "react"

// This component sets the language tag on the client side.

export function LanguageProvider(props: { language: AvailableLanguageTag; children?: ReactNode }) {
	setLanguageTag(props.language)
	return <>{props.children}</>
}
