import { createHandle, type HandleOptions } from "./hooks/handle.js"
import { createReroute } from "./hooks/reroute.js"
import { base } from "$app/paths"
import { page } from "$app/stores"
import { get } from "svelte/store"
import type { PathTranslations } from "./path-translations/types.js"
import type { Paraglide } from "./runtime.js"
import { getTranslatedPath } from "./path-translations/getTranslatedPath.js"
import { serializeRoute } from "./utils/serialize-path.js"
import { getCanonicalPath } from "./path-translations/getCanonicalPath.js"
import { getPathInfo } from "./utils/get-path-info.js"
import { normaliseBase as canonicalNormaliseBase } from "./utils/normaliseBase.js"

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
	 * A list of paths to exclude from translation. You can use strings or regular expressions.
	 *
	 * Any path that matches one of the strings or regular expressions will not be translated,
	 * meaning that it won't get the language tag in the path, any links to it won't be translated,
	 * and no alternate links will be generated for it.
	 *
	 * @default []
	 *
	 * @example
	 * ```ts
	 * exclude: ["/base/admin", /^\/base\/admin\/.* /]
	 * ```
	 */
	exclude: (string | RegExp)[]

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
export function createI18n<T extends string>(runtime: Paraglide<T>, options?: I18nUserConfig<T>) {
	const translations = options?.pathnames ?? {}

	const exclude = options?.exclude ?? []
	const stringExcludes = exclude.filter((e) => typeof e === "string") as string[]
	const regexExcludes = exclude.filter((e) => e instanceof RegExp) as RegExp[]
	const defaultLanguageTag = options?.defaultLanguageTag ?? runtime.sourceLanguageTag

	const config: I18nConfig<T> = {
		runtime,
		translations,
		exclude: (path) => {
			if (stringExcludes.some((e) => path.startsWith(e))) return true
			if (regexExcludes.some((e) => e.test(path))) return true
			return false
		},
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
			const pathWithLanguage = url.pathname.slice(normaliseBase(base).length)
			const lang = pathWithLanguage.split("/").filter(Boolean).at(0)

			if (runtime.isAvailableLanguageTag(lang)) return lang
			return defaultLanguageTag
		},

		/**
		 * Takes in a route and returns a translated version of it.
		 * This is useful for use in `goto` statements and `redirect` calls.
		 *
		 * @param canonicalPath The path to translate (eg _/base/about_)
		 * @param lang The language to translate to - Defaults to the current language
		 * @returns The translated path (eg _/base/de/ueber-uns_)
		 *
		 * @example
		 * ```ts
		 * redirect(i18n.resolveRoute("/base/about", "de"))
		 * ```
		 */
		route(path: string, lang: T | undefined = undefined) {
			if (config.exclude(path)) return path

			lang = lang ?? runtime.languageTag()

			const canonicalPath = path.slice(normaliseBase(base).length)
			const translatedPath = getTranslatedPath(canonicalPath, lang, translations)

			return serializeRoute({
				path: translatedPath,
				lang,
				base: normaliseBase(base),
				dataSuffix: undefined,
				includeLanguage: true,
				defaultLanguageTag,
				prefixDefaultLanguage: config.prefixDefaultLanguage,
			})
		},

		/**
		 * Takes in a path in one language and returns it's canonical version.
		 * Basically the oposite of `i18n.route()`.
		 * This is useful for use in language switchers.
		 *
		 * @param targetedPathSource The path to translate (eg _/base/de/ueber-uns_)
		 * @returns The canonical version path (eg _/base/about_)
		 *
		 * @example
		 * ```ts
		 * <a
		 *   href={i18n.getCanonicalPath($page.url.pathname)}
		 *   hreflang="en"
		 * >
		 * ```
		 */
		getCanonicalPath(translatedPath: string) {
			const { path, lang } = getPathInfo(translatedPath, {
				base: normaliseBase(base),
				availableLanguageTags: config.runtime.availableLanguageTags,
				defaultLanguageTag: config.defaultLanguageTag,
			})

			const canonicalPath = getCanonicalPath(path, lang, translations)
			return normaliseBase(base) + canonicalPath
		},
	}
}

function normaliseBase(base: string) {
	return canonicalNormaliseBase(base, new URL(get(page).url))
}

export type I18n<T extends string> = ReturnType<typeof createI18n<T>>
