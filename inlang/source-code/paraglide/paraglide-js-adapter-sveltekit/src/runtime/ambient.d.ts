/// <reference types="@sveltejs/kit" />

declare module "$paraglide-adapter-sveltekit:translate-path" {
	export default function translatePath(path: string, languageTag: string): string
}

declare module "$paraglide-adapter-sveltekit:get-language" {
	export default function getLanguage(url: URL): string | undefined
}

declare module "$paraglide-adapter-sveltekit:runtime" {
	export const sourceLanguageTag: string
	export const availableLanguageTags: readonly string[]
	export function isAvailableLanguageTag(tag: string): boolean
	export function languageTag(): string
	export function setLanguageTag(tag: string): void
	export function onSetLanguageTag(callback: (tag: string) => void): void
}
