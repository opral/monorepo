"use client"
import { setLanguageTag } from "$paraglide-adapter-next-internal/runtime.js"

/**
 * A client side component that sets the language tag on mount.
 * @param props 
 * @returns 
 */
export function ClientLanguageProvider(props: { language: string }) {
	setLanguageTag(props.language)
	return null
}
