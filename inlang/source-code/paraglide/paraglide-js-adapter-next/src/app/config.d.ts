import type { ExcludeConfig } from "./exclude"

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
	 * The default language to use when no language is set.
	 *
	 * @default sourceLanguageTag
	 */
	defaultLanguage?: T
}
