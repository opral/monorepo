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
 * @type {Array<"cookie" | "baseLocale" | "pathname" | "globalVariable">}
 */
export const strategy = ["globalVariable"];

/**
 * The localized pathnames.
 *
 * @type {Record<string, Record<Locale, string>>}
 */
export const pathnames = {};

/**
 * Whether the pathnames are the default pathnames.
 *
 * If the default pathnames are used, the matching is done
 * statically with no runtime matching logic which reduces
 * the bundlesize.
 *
 * @type {boolean}
 */
export const TREE_SHAKE_IS_DEFAULT_PATHNAMES = false;

export const TREE_SHAKE_COOKIE_STRATEGY_USED = false;

export const TREE_SHAKE_PATHNAME_STRATEGY_USED = false;

export const TREE_SHAKE_GLOBAL_VARIABLE_STRATEGY_USED = false;
