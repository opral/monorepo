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

/** @type {number} */
export const cookieMaxAge = 60 * 60 * 24 * 400;

/** @type {string} */
export const cookieDomain = "<cookie-domain>";

/** @type {string} */
export const localStorageKey = "PARAGLIDE_LOCALE";

/**
 * @type {Array<"cookie" | "baseLocale" | "globalVariable" | "url" | "preferredLanguage" | "localStorage" | `custom-${string}`>}
 */
export const strategy = ["globalVariable"];

/**
 * The used URL patterns.
 *
 * @type {Array<{ pattern: string, localized: Array<[Locale, string]> }> }
 */
export const urlPatterns = [];

/**
 * @typedef {{
 * 		getStore(): {
 *   		locale?: Locale,
 * 			origin?: string,
 * 			messageCalls?: Set<string>
 *   	} | undefined,
 * 		run: (store: { locale?: Locale, origin?: string, messageCalls?: Set<string>},
 *    cb: any) => any
 * }} ParaglideAsyncLocalStorage
 */

/**
 * Server side async local storage that is set by `serverMiddleware()`.
 *
 * The variable is used to retrieve the locale and origin in a server-side
 * rendering context without effecting other requests.
 *
 * @type {ParaglideAsyncLocalStorage | undefined}
 */
export let serverAsyncLocalStorage = undefined;

export const disableAsyncLocalStorage = false;

export const experimentalMiddlewareLocaleSplitting = false;

export const isServer = typeof window === "undefined";

/**
 * Sets the server side async local storage.
 *
 * The function is needed because the `runtime.js` file
 * must define the `serverAsyncLocalStorage` variable to
 * avoid a circular import between `runtime.js` and
 * `server.js` files.
 *
 * @param {ParaglideAsyncLocalStorage | undefined} value
 */
export function overwriteServerAsyncLocalStorage(value) {
	serverAsyncLocalStorage = value;
}

export const TREE_SHAKE_COOKIE_STRATEGY_USED = false;

export const TREE_SHAKE_URL_STRATEGY_USED = false;

export const TREE_SHAKE_GLOBAL_VARIABLE_STRATEGY_USED = false;

export const TREE_SHAKE_PREFERRED_LANGUAGE_STRATEGY_USED = false;

export const TREE_SHAKE_DEFAULT_URL_PATTERN_USED = false;

export const TREE_SHAKE_LOCAL_STORAGE_STRATEGY_USED = false;
