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