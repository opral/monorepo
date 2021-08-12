import type { Translations } from './types';
/**
 * Loads the translations for a given locale.
 *
 * You must set the translations after loading the translations afterwards
 * like so:
 * ```JS
 *  const translations = await loadTranslations(...args);
 *  setTranslations(translations);
 * ```
 *
 * The load and set API is especially useful for SSR and static site generation
 * since the translations can be fetched beforehand and passed to the site.
 *
 *
 * @param projectDomain The domain you specified when creating your inlang project.
 * @param locale The locale of the translations to be loaded. Your user is from Germany?
 * Then the locale is "de". If the `developmentLocale` and `locale` are identical, pass
 * both e.g. `loadTranslations("example.com", "en", "en")
 *
 */
export declare function loadTranslations(projectDomain: string, locale: string): Promise<Translations>;
/**
 * Sets the translations internally which are used by the `t()` function.
 *
 * @param translations The translations as returned by `await loadTranslations(...args)`
 */
export declare function setTranslations(translations: Translations): void;
/**
 * Translates given text based on the loaded translations.
 *
 * If the text does not exist in the translations, or any error occurs, the provided
 * (untranslated) text is returned as fallback.
 *
 *  In case the fallback was unintentional, did you forget to set the translations via
 * `setTranslations()` ?
 *
 * Sometimes the latter is intentional. Your development language e.g. German,
 * Spanish etc. does not need to be translated and for those locales no translations
 * exist.
 *
 */
export declare function t(text: string): string;
