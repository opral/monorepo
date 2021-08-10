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
export declare function loadTranslations(projectDomain: string, locale: string | undefined): Promise<Record<string, string> | null>;
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
