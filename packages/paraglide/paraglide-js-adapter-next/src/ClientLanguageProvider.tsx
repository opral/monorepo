"use client"
import { setLanguageTag } from "$paraglide-adapter-next-internal/runtime.js"

export function ClientLanguageProvider(props: { language: string }) {
	setLanguageTag(props.language)
	return null
}
