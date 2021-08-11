/**
 * The locale of the current translations.
 *
 * Do not set the locale! Use `loadTranslations` instead to ensure that
 * the translations for the locale are loaded.
 *
 * `t` always returns the provided `text` as fallback when currentLocale is `undefined`.
 */
export declare let currentLocale: string | undefined;
/**
 * Loads the translations for a given locale via a network request for further
 * use internally but also returns the translations for external usage.
 *
 * @param projectDomain
 * @param locale
 *
 * If the locale is undefined, no (new) translations are fetched. Previous fetches
 * are not overwridden but will not be used by the `t()` function.
 */
export declare function loadTranslations(projectDomain: string, locale: string): Promise<Record<string, string | undefined> | null>;
/**
 * Translates given text based on the loaded translations.
 *
 * If the translations are `undefined`, or any error occurs, the provided (untranslated) text is
 * returned as fallback.
 *
 * Sometimes the latter case is intentional. Your development language
 * e.g. German, Spanish etc. does not need to be translated and for those locales no translations
 * exist.
 */
export declare function t(text: string): string;
