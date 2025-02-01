/**
 * The project's base locale.
 *
 * @example
 *   if (locale === baseLocale) {
 *     // do something
 *   }
 */
export const baseLocale = "<base-locale>";

/**
 * The project's locales that have been specified in the settings.
 *
 * @example
 *   if (locales.includes(userSelectedLocale) === false) {
 *     throw new Error('Locale is not available');
 *   }
 */
export const locales = /** @type {const} */ (["<base-locale>"]);

/** @type {string} */
export const cookieName = "<cookie-name>";

/**
 * @type {Array<"cookie" | "baseLocale" | "pathname" | "variable">}
 */
export const strategy = ["variable"];

/** @type {boolean} */
export const pathnamePrefixDefaultLocale = false;

/** 
 * Mapping of the pathnames for fast retrieval of the locale. 
 * 
 * Input: 
 *   { "/home": { "en": "/home", "de": "start" } }
 * 
 * Mapped: 
 *   { "/home": "en", "/start": "de" }
 * 
 * @type {Record<string, string>} 
 */
export const mappedPathnames = {};

/**
 * The localized pathnames. 
 * 
 * @type {Record<string, Record<Locale, string>>} 
 */
export const pathnames = {}