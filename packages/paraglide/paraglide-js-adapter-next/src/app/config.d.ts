import type { ExcludeConfig } from "./exclude"
import { UserPathTranslations } from "./pathnames/types"

export type I18nOptions<T extends string> = {
	/**
	 * A list of patterns that should not be localized.
	 *
	 * @example
	 * ```ts
	 * exclude: [/^\/api\//] // Exclude `/api/*` from localization
	 * ```
	 *
	 * @default []
	 */
	exclude?: ExcludeConfig

	/**
	 * The translations for pathnames.
	 * They should **not** include the base path or the language tag.
	 *
	 * You can include parameters in the pathnames by using square brackets.
	 * If you are using a parameter, you must include it in all translations.
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
	 *    //you can also use messages for pathnames (pass as reference)
	 *    "/admin": m.admin_path
	 * }
	 * ```
	 */
	pathnames?: UserPathTranslations<T>

	/**
	 * The default language to use when no language is set.
	 *
	 * @default sourceLanguageTag
	 */
	defaultLanguage?: T
}
