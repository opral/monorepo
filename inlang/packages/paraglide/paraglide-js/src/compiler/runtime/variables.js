/**
 * The project's base locale.
 *
 * @example
 *   if (locale === baseLocale) {
 *     // do something
 *   }
 */
export const baseLocale = "en";

/**
 * The project's locales that have been specified in the settings.
 *
 * @example
 *   if (locales.includes(userSelectedLocale) === false) {
 *     throw new Error('Locale is not available');
 *   }
 */
export const locales = /** @type {const} */ (["en", "de"]);

/** @type {string} */
export const cookieName = "<cookie-name>";

/**
 * @type {Array<"cookie" | "baseLocale" | "globalVariable" | "url" | "preferredLanguage">}
 */
export const strategy = ["globalVariable"];

/**
 * The used URL patterns.
 *
 * @type {Array<{ pattern: string, deLocalizedNamedGroups: Record<string, string | null>, localizedNamedGroups: Record<string, Record<string, string | null>> }>}
 */
export const urlPatterns = [];

export const TREE_SHAKE_COOKIE_STRATEGY_USED = false;

export const TREE_SHAKE_URL_STRATEGY_USED = false;

export const TREE_SHAKE_GLOBAL_VARIABLE_STRATEGY_USED = false;

export const TREE_SHAKE_PREFERRED_LANGUAGE_STRATEGY_USED = false;

export const TREE_SHAKE_DEFAULT_URL_PATTERN_USED = false;
