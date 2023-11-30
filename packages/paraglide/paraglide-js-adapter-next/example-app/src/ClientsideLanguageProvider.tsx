"use client"
import { AvailableLanguageTag, setLanguageTag } from "@/paraglide/runtime"

export function ClientSideLanguageProvider(props: { language: AvailableLanguageTag }) {
	setLanguageTag(props.language)
	return null
}
