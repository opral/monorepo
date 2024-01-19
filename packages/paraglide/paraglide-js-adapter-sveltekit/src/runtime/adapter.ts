import { createHandle, type HandleOptions } from "./hooks/handle.js"
import { createReroute } from "./hooks/reroute.js"
import { base } from "$app/paths"
import { page } from "$app/stores"
import { get } from "svelte/store"
import type { PathTranslations } from "./path-translations/types.js"
import type { Paraglide } from "./runtime.js"
import { getTranslatedPath } from "./path-translations/getTranslatedPath.js"
import { serializeRoute } from "./utils/serialize-path.js"
import { translatePath } from "./path-translations/translatePath.js"

export type I18nUserConfig<T extends string> = {
	/**
	 * The default languageTag to use if no locale is specified.
	 * By default the sourceLanguageTag from the Paraglide runtime is used.
	 *
	 * @default runtime.sourceLanguageTag
	 */
	defaultLanguageTag?: T

	/**
	 * The translations for pathnames.
	 * They should **not** include the base path or the language tag.
	 *
	 * You can include parameters in the pathnames by using square brackets.
	 * If you are using a parameter, you must include it in all translations.
	 *
	 * If you are using translated pathnames, make sure you have the `i18n.reroute()` hook registered in your `src/hooks.js` file.
	 *
	 * @example
	 * ```ts
	 * pathnames: {
	 *   "/about": {
	 *     de: "/ueber-uns",
	 *     en: "/about",
	 *     fr: "/a-propos",
	 *   },
	 *   "/users/[slug]": {
	 *      en: "/users/[slug]",
	 *      // parameters don't have to be their own path-segment
	 *      de: "/benutzer-[slug]",
	 *      // parameters don't have to be in the same position
	 *      fr: "/[slug]/utilisateurs",
	 *    },
	 * }
	 * ```
	 */
	pathnames?: PathTranslations<T>

	/**
	 * A predicate that determines whether a page should be excluded from translation.
	 * If it returns `true`, any links to it will not be translated,
	 * and no alternate links will be added while on it.
	 *
	 * @default () => false
	 * @param path The path to check (eg /base/api)
	 * @returns `true` if the path should be excluded from translation
	 *
	 * @example
	 * ```ts
	 * exclude: (path) => path.startsWith("/base/api")
	 * ```
	 */
	exclude?: (path: string) => boolean

	/**
	 * Whether to prefix the language tag to the path even if it's the default language.
	 *
	 * - If set to `"always"`, the language tag will always be included in the path. (eg `/base/en/about`)
	 * - If set to `"never"`, the default language will not have a language tag in the path. (eg `/base/about`)
	 *
	 * @default "never"
	 */
	prefixDefaultLanguage?: "always" | "never"
}

/**
 * The _resolved_ configuration for the i18n instance.
 */
export type I18nConfig<T extends string> = {
	runtime: Paraglide<T>
	translations: PathTranslations<T>
	exclude: (path: string) => boolean
	defaultLanguageTag: T
	prefixDefaultLanguage: "always" | "never"
}

/**
 * Creates an i18n instance that manages your internationalization.
 *
 * @param runtime The Paraglide runtime.
 * @param options The options for the i18n instance.
 * @returns An i18n instance.
 *
 * @example
 * ```ts
 * // src/lib/i18n.js
 * import * as runtime from "../paraglide/runtime.js"
 * import { createI18n } from "@inlang/paraglide-js-adapter-sveltekit"
 *
 * export const i18n = createI18n(runtime, { ...options })
 * ```
 */
export function i18nRouting<T extends string>(runtime: Paraglide<T>, options?: I18nUserConfig<T>) {
	const translations = options?.pathnames ?? {}

	const exclude = options?.exclude ?? (() => false)
	const defaultLanguageTag = options?.defaultLanguageTag ?? runtime.sourceLanguageTag

	const config: I18nConfig<T> = {
		runtime,
		translations,
		exclude,
		defaultLanguageTag,
		prefixDefaultLanguage: options?.prefixDefaultLanguage ?? "never",
	}

	// We don't want the translations to be mutable
	Object.freeze(translations)
	Object.freeze(config)

	return {
		/**
		 * The configuration that was used to create this i18n instance.
		 */
		config,

		/**
		 * Returns a `reroute` hook that applies the path translations to the paths.
		 * Register it in your `src/hooks.js` file to enable path translations.
		 *
		 * @example
		 * ```ts
		 * // src/hooks.js
		 * import { i18n } from "$lib/i18n.js"
		 * export const reroute = i18n.reroute()
		 * ```
		 */
		reroute: () => createReroute(config),

		/**
		 * Returns a `handle` hook that set's the correct `lang` attribute
		 * on the `html` element
		 */
		handle: (options: HandleOptions) => createHandle(config, options),

		/**
		 * Takes in a URL and returns the language that should be used for it.
		 * @param url
		 * @returns
		 */
		getLanguageFromUrl(url: URL): T {
			const pathWithLanguage = url.pathname.slice(normalizeBase(base).length)
			const lang = pathWithLanguage.split("/").filter(Boolean).at(0)

			if (runtime.isAvailableLanguageTag(lang)) return lang
			return defaultLanguageTag
		},

		/**
		 * Takes in a route and returns a translated version of it.
		 * This is useful for use in `goto` statements and `redirect` calls.
		 *
		 * @param canonicalPath The path to translate (eg _/base/about_)
		 * @param lang The language to translate to
		 * @returns The translated path (eg _/base/de/ueber-uns_)
		 *
		 * @example
		 * ```ts
		 * redirect(i18n.resolveRoute("/base/about", "de"))
		 * ```
		 */
		resolveRoute(path: string, lang: T) {
			if (config.exclude(path)) return path

			const canonicalPath = path.slice(normalizeBase(base).length)
			const translatedPath = getTranslatedPath(canonicalPath, lang, translations)

			return serializeRoute({
				path: translatedPath,
				lang,
				base: normalizeBase(base),
				dataSuffix: undefined,
				includeLanguage: true,
				defaultLanguageTag,
				prefixDefaultLanguage: config.prefixDefaultLanguage,
			})
		},

		/**
		 * Takes in a path in one language and returns it's translated version in another language.
		 * This is useful for use in `alternate` links.
		 *
		 * @param translatedPath The path to translate (eg _/base/de/ueber-uns_)
		 * @param targetLanguage The language to translate to (eg _en_)
		 * @returns The translated path (eg _/base/en/about_)
		 *
		 * @example
		 * ```ts
		 * <link
		 *   rel="alternate"
		 *   href={i18n.translatePath($page.url.pathname, languageTag(), "en")}
		 *   hreflang="en"
		 * >
		 * ```
		 */
		translatePath(translatedPath: string, targetLanguage: T) {
			return translatePath(translatedPath, targetLanguage, translations, {
				base: normalizeBase(base),
				defaultLanguageTag,
				availableLanguageTags: runtime.availableLanguageTags,
				prefixDefaultLanguage: config.prefixDefaultLanguage,
			})
		},
	}
}

function normalizeBase(base: string) {
	if (base == "") return base

	//The base may be a relative path during SSR component initialization.
	//If that's the case, we need to make it absolute.
	if (!base.startsWith("/")) {
		const absoluteBase = new URL(base, get(page).url).pathname
		return absoluteBase
	}
	return base
}

export type I18n<T extends string> = ReturnType<typeof i18nRouting<T>>
