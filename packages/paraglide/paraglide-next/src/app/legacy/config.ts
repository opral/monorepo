import type { ExcludeConfig } from "../exclude"
import type {
	UserPathDefinitionTranslations,
	PathDefinitionTranslations,
} from "@inlang/paraglide-js/internal/adapter-utils"

export type I18nUserConfig<T extends string> = {
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
	pathnames?: UserPathDefinitionTranslations<T>

	/**
	 * In what cases should the language be added to the URL?
	 *
	 * @case "except-default" Only add the language to the URL if it is not the default language
	 * @case "all" Always add the language to the URL. If no language is present, detec language and redirect
	 * @case "never" Rely entirely on language detection
	 *
	 * Language detection works by:
	 * 1. Checking if a NEXT_LOCALE cookie is set
	 * 2. Checking using the accept-language header
	 * 3. Fallback to the default language
	 *
	 * @default "except-default"
	 */
	prefix?: "all" | "except-default" | "never"

	/**
	 * The language to use in case language detection fails.
	 * @default sourceLanguageTag
	 */
	defaultLanguage?: T
}

export type ResolvedI18nConfig<T extends string> = {
	exclude: (path: string) => boolean
	pathnames: PathDefinitionTranslations<T>
	prefix: "all" | "except-default" | "never"
}
