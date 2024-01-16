import { createHandle, type HandleOptions } from "./hooks/handle.js"
import { createReroute } from "./hooks/reroute.js"
import { base } from "$app/paths"
import { page } from "$app/stores"
import { get } from "svelte/store"
import type { PathTranslations } from "./path-translations/types.js"
import type { Paraglide } from "./runtime.js"

export type I18nOptions<T extends string> = {
	/**
	 * The default locale to use if no locale is specified.
	 * By default the sourceLanguageTag from the Paraglide runtime is used.
	 *
	 * @default runtime.sourceLanguageTag
	 */
	defaultLocale?: T

	/**
	 * Translations for pathnames.
	 */
	pathnames?: PathTranslations<T>

	/**
	 * A predicate that determines whether a URL should be excluded from translation.
	 * If it returns `true`, any links to it will not be translated,
	 * and no alternate links will be added while on it.
	 *
	 * @default () => false
	 * @param url The URL to check
	 * @returns `true` if the URL should be excluded from translation
	 *
	 * @example
	 * ```ts
	 * exclude: (url) => url.pathname.startsWith("/api")
	 * ```
	 */
	exclude?: (url: URL) => boolean

	/**
	 * Whether to prefix the language tag to the path even if it's the default language.
	 * @default "always"
	 */
	prefixDefaultLanguage?: "always" | "never"
}

export function createI18n<T extends string>(runtime: Paraglide<T>, options: I18nOptions<T>) {
	const translations = options.pathnames ?? {}

	// We don't want the translations to be mutable
	Object.freeze(translations)

	return {
		...runtime,
		translations,
		exclude: options.exclude ?? (() => false),

		/**
		 * Returns a `reroute` hook that applies the path translations to the paths
		 */
		reroute: () => createReroute(runtime, translations),

		/**
		 * Returns a `handle` hook that set's the correct `lang` attribute
		 * on the `html` element
		 */
		handle: (options: HandleOptions) => createHandle(runtime, options),

		getLanguageFromUrl(url: URL) {
			const absoluteBase = new URL(base, get(page).url).pathname
			const pathWithLanguage = url.pathname.slice(absoluteBase.length)
			const [lang, ...parts] = pathWithLanguage.split("/").filter(Boolean)

			if (runtime.isAvailableLanguageTag(lang)) return lang
			return runtime.sourceLanguageTag
		},
	}
}

export type I18n<T extends string> = ReturnType<typeof createI18n<T>>
