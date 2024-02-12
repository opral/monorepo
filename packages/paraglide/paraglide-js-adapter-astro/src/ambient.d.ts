/**
 * The compiled paraglide runtime module.
 * (e.g. "paraglide/runtime.js")
 */
declare module "paraglide-js-adapter-astro:runtime" {
	export const setLanguageTag: (language_tag: string | (() => string)) => void
	export const languageTag: () => string
	export const onSetLanguageTag: (callback: (language_tag: string) => void) => void
	export const isAvailableLanguageTag: (language_tag: unknown) => language_tag is string
	export const availableLanguageTags: readonly string[]
	export const sourceLanguageTag: string
}

declare module "astro:i18n" {
	export const getLocaleByPath: (path: string) => string
	export const getPathByLocale: (locale: string) => string
}

declare namespace App {
	interface Locals {
		paraglide: {
			lang: string
			dir: "ltr" | "rtl"
		}
	}
}
