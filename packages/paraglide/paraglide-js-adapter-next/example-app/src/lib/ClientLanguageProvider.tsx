"use client"
import { AvailableLanguageTag, setLanguageTag } from "@/paraglide/runtime"

export function ClientLanguageProvider(props: { language: AvailableLanguageTag }) {
	setLanguageTag(props.language)
	return null
}
