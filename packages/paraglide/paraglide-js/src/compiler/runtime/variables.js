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
 * @type {Array<"domain" | "cookie" | "baseLocale" | "pathname" | "globalVariable" | "urlPattern">}
 */
export const strategy = ["globalVariable"];

/**
 * The localized pathnames.
 *
 * @type {Record<string, Record<Locale, string>>}
 */
export const pathnames = {};

/** @type {string | undefined} */
export const pathnameBase = undefined;

/** @type {Record<Locale, string> | undefined} */
export const domains = undefined;

/** @type {Array<{ pattern: string, deLocalizedParams?: Record<string, string | null>, localizedParams: Record<Locale, Record<string, string | undefined>> }>} */
export const urlPatterns = [];

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
