// eslint-disable

import "@inlang/paraglide-js/urlpattern-polyfill";

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
export const cookieName = "PARAGLIDE_LOCALE";
/**
 * @type {Array<"cookie" | "baseLocale" | "globalVariable" | "url" | "preferredLanguage">}
 */
export const strategy = [
  "url"
];
/**
 * The used URL patterns.
 *
 * @type {Array<{ pattern: string, deLocalizedNamedGroups: Record<string, string | null>, localizedNamedGroups: Record<string, Record<string, string | null>> }>}
 */
export const urlPatterns = [
  {
    "pattern": ":protocol://:domain(.*)::port?/:locale(de|en)?/:path(.*)?",
    "deLocalizedNamedGroups": {
      "locale": "en"
    },
    "localizedNamedGroups": {
      "de": {
        "locale": "de"
      },
      "en": {
        "locale": "en"
      }
    }
  }
];
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
export const experimentalMiddlewareLocaleSplitting = false;
export const isServer = undefined;
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
const TREE_SHAKE_COOKIE_STRATEGY_USED = false;
const TREE_SHAKE_URL_STRATEGY_USED = true;
const TREE_SHAKE_GLOBAL_VARIABLE_STRATEGY_USED = false;
const TREE_SHAKE_PREFERRED_LANGUAGE_STRATEGY_USED = false;
const TREE_SHAKE_DEFAULT_URL_PATTERN_USED = false;

globalThis.__paraglide = {}

/**
 * This is a fallback to get started with a custom
 * strategy and avoid type errors.
 *
 * The implementation is overwritten
 * by \`overwriteGetLocale()\` and \`defineSetLocale()\`.
 *
 * @type {Locale|undefined}
 */
let _locale;
/**
 * Get the current locale.
 *
 * @example
 *   if (getLocale() === 'de') {
 *     console.log('Germany 🇩🇪');
 *   } else if (getLocale() === 'nl') {
 *     console.log('Netherlands 🇳🇱');
 *   }
 *
 * @type {() => Locale}
 */
export let getLocale = () => {
    /** @type {string | undefined} */
    let locale;
    // if running in a server-side rendering context
    // retrieve the locale from the async local storage
    if (serverAsyncLocalStorage) {
        const locale = serverAsyncLocalStorage?.getStore()?.locale;
        if (locale) {
            return locale;
        }
    }
    for (const strat of strategy) {
        if (TREE_SHAKE_COOKIE_STRATEGY_USED && strat === "cookie") {
            locale = extractLocaleFromCookie();
        }
        else if (strat === "baseLocale") {
            locale = baseLocale;
        }
        else if (TREE_SHAKE_URL_STRATEGY_USED &&
            strat === "url" &&
            typeof window !== "undefined") {
            locale = extractLocaleFromUrl(window.location.href);
        }
        else if (TREE_SHAKE_GLOBAL_VARIABLE_STRATEGY_USED &&
            strat === "globalVariable" &&
            _locale !== undefined) {
            locale = _locale;
        }
        else if (TREE_SHAKE_PREFERRED_LANGUAGE_STRATEGY_USED &&
            strat === "preferredLanguage" &&
            typeof window !== "undefined") {
            locale = negotiatePreferredLanguageFromNavigator();
        }
        // check if match, else continue loop
        if (locale !== undefined) {
            return assertIsLocale(locale);
        }
    }
    throw new Error("No locale found. Read the docs https://inlang.com/m/gerre34r/library-inlang-paraglideJs/errors#no-locale-found");
};
/**
 * Negotiates a preferred language from navigator.languages.
 *
 * @returns {string|undefined} The negotiated preferred language.
 */
function negotiatePreferredLanguageFromNavigator() {
    if (!navigator?.languages?.length) {
        return undefined;
    }
    const languages = navigator.languages.map((lang) => ({
        fullTag: lang.toLowerCase(),
        baseTag: lang.split("-")[0]?.toLowerCase(),
    }));
    for (const lang of languages) {
        if (isLocale(lang.fullTag)) {
            return lang.fullTag;
        }
        else if (isLocale(lang.baseTag)) {
            return lang.baseTag;
        }
    }
    return undefined;
}
/**
 * Overwrite the \`getLocale()\` function.
 *
 * Use this function to overwrite how the locale is resolved. For example,
 * you can resolve the locale from the browser's preferred language,
 * a cookie, env variable, or a user's preference.
 *
 * @example
 *   overwriteGetLocale(() => {
 *     // resolve the locale from a cookie. fallback to the base locale.
 *     return Cookies.get('locale') ?? baseLocale
 *   }
 *
 * @type {(fn: () => Locale) => void}
 */
export const overwriteGetLocale = (fn) => {
    getLocale = fn;
}; 

/**
 * Set the locale.
 *
 * @example
 *   setLocale('en');
 *
 * @type {(newLocale: Locale) => void}
 */
export let setLocale = (newLocale) => {
    let localeHasBeenSet = false;
    for (const strat of strategy) {
        if (TREE_SHAKE_GLOBAL_VARIABLE_STRATEGY_USED &&
            strat === "globalVariable") {
            // a default for a custom strategy to get started quickly
            // is likely overwritten by `defineSetLocale()`
            _locale = newLocale;
            localeHasBeenSet = true;
        }
        else if (TREE_SHAKE_COOKIE_STRATEGY_USED && strat === "cookie") {
            if (typeof document === "undefined") {
                continue;
            }
            // set the cookie
            document.cookie = `${cookieName}=${newLocale}; path=/`;
            localeHasBeenSet = true;
        }
        else if (strat === "baseLocale") {
            // nothing to be set here. baseLocale is only a fallback
            continue;
        }
        else if (TREE_SHAKE_URL_STRATEGY_USED &&
            strat === "url" &&
            typeof window !== "undefined") {
            // route to the new url
            //
            // this triggers a page reload but a user rarely
            // switches locales, so this should be fine.
            //
            // if the behavior is not desired, the implementation
            // can be overwritten by `defineSetLocale()` to avoid
            // a full page reload.
            window.location.href = localizeUrl(window.location.href, {
                locale: newLocale,
            }).href;
            // just in case return. the browser reloads the page by setting href
            return;
        }
    }
    if (localeHasBeenSet === false) {
        throw new Error("No strategy was able to set the locale. This can happen if you use browser-based strategies like `cookie` in a server-side rendering environment. Overwrite setLocale() on the server to avoid this error.");
    }
    else if (typeof window !== "undefined" && window.location) {
        // reload the page to reflect the new locale
        window.location.reload();
    }
    return;
};
/**
 * Overwrite the \`setLocale()\` function.
 *
 * Use this function to overwrite how the locale is set. For example,
 * modify a cookie, env variable, or a user's preference.
 *
 * @example
 *   overwriteSetLocale((newLocale) => {
 *     // set the locale in a cookie
 *     return Cookies.set('locale', newLocale)
 *   });
 *
 * @param {(newLocale: Locale) => void} fn
 */
export const overwriteSetLocale = (fn) => {
    setLocale = fn;
};

/**
 * The origin of the current URL.
 *
 * Defaults to "http://y.com" in non-browser environments. If this
 * behavior is not desired, the implementation can be overwritten
 * by `overwriteGetUrlOrigin()`.
 *
 * @type {() => string}
 */
export let getUrlOrigin = () => {
    if (serverAsyncLocalStorage) {
        return serverAsyncLocalStorage.getStore()?.origin ?? "http://fallback.com";
    }
    else if (typeof window !== "undefined") {
        return window.location.origin;
    }
    return "http://fallback.com";
};
/**
 * Overwrite the getUrlOrigin function.
 *
 * Use this function in server environments to
 * define how the URL origin is resolved.
 *
 * @type {(fn: () => string) => void}
 */
export let overwriteGetUrlOrigin = (fn) => {
    getUrlOrigin = fn;
};

/**
 * Check if something is an available locale.
 *
 * @example
 *   if (isLocale(params.locale)) {
 *     setLocale(params.locale);
 *   } else {
 *     setLocale('en');
 *   }
 *
 * @param {any} locale
 * @returns {locale is Locale}
 */
export function isLocale(locale) {
    return !locale ? false : locales.includes(locale);
}

/**
 * Asserts that the input is a locale.
 *
 * @param {any} input - The input to check.
 * @returns {Locale} The input if it is a locale.
 * @throws {Error} If the input is not a locale.
 */
export function assertIsLocale(input) {
    if (isLocale(input) === false) {
        throw new Error(`Invalid locale: ${input}. Expected one of: ${locales.join(", ")}`);
    }
    return input;
}

/**
 * Extracts a locale from a request.
 *
 * Use the function on the server to extract the locale
 * from a request.
 *
 * The function goes through the strategies in the order
 * they are defined.
 *
 * @example
 *   const locale = extractLocaleFromRequest(request);
 *
 * @type {(request: Request) => Locale}
 */
export const extractLocaleFromRequest = (request) => {
    /** @type {string|undefined} */
    let locale;
    for (const strat of strategy) {
        if (TREE_SHAKE_COOKIE_STRATEGY_USED && strat === "cookie") {
            locale = request.headers
                .get("cookie")
                ?.split("; ")
                .find((c) => c.startsWith(cookieName + "="))
                ?.split("=")[1];
        }
        else if (TREE_SHAKE_URL_STRATEGY_USED && strat === "url") {
            locale = extractLocaleFromUrl(request.url);
        }
        else if (TREE_SHAKE_PREFERRED_LANGUAGE_STRATEGY_USED &&
            strat === "preferredLanguage") {
            const acceptLanguageHeader = request.headers.get("accept-language");
            if (acceptLanguageHeader) {
                locale = negotiatePreferredLanguageFromHeader(acceptLanguageHeader);
            }
        }
        else if (strat === "globalVariable") {
            locale = _locale;
        }
        else if (strat === "baseLocale") {
            return baseLocale;
        }
        else {
            throw new Error(`Unsupported strategy: ${strat}`);
        }
        if (locale !== undefined) {
            return assertIsLocale(locale);
        }
    }
    throw new Error("No locale found. There is an error in your strategy. Try adding 'baseLocale' as the very last strategy.");
};
/**
 * Negotiates a preferred language from a header.
 *
 * @param {string} header - The header to negotiate from.
 * @returns {string|undefined} The negotiated preferred language.
 */
function negotiatePreferredLanguageFromHeader(header) {
    // Parse language preferences with their q-values and base language codes
    const languages = header
        .split(",")
        .map((lang) => {
        const [tag, q = "1"] = lang.trim().split(";q=");
        // Get both the full tag and base language code
        const baseTag = tag?.split("-")[0]?.toLowerCase();
        return {
            fullTag: tag?.toLowerCase(),
            baseTag,
            q: Number(q),
        };
    })
        .sort((a, b) => b.q - a.q);
    for (const lang of languages) {
        if (isLocale(lang.fullTag)) {
            return lang.fullTag;
        }
        else if (isLocale(lang.baseTag)) {
            return lang.baseTag;
        }
    }
    return undefined;
}

/**
 * Extracts a cookie from the document.
 *
 * Will return undefined if the docuement is not available or if the cookie is not set.
 * The `document` object is not available in server-side rendering, so this function should not be called in that context.
 *
 * @returns {string | undefined}
 */
export function extractLocaleFromCookie() {
    if (typeof document === "undefined" || !document.cookie) {
        return;
    }
    const match = document.cookie.match(new RegExp(`(^| )${cookieName}=([^;]+)`));
    const locale = match?.[2];
    if (isLocale(locale)) {
        return locale;
    }
    return undefined;
}

/**
 * Extracts the locale from a given URL using native URLPattern.
 *
 * @param {URL|string} url - The full URL from which to extract the locale.
 * @returns {Locale|undefined} The extracted locale, or undefined if no locale is found.
 */
export function extractLocaleFromUrl(url) {
    if (TREE_SHAKE_DEFAULT_URL_PATTERN_USED) {
        return defaultUrlPatternExtractLocale(url);
    }
    for (const element of urlPatterns) {
        const pattern = new URLPattern(element.pattern);
        const match = pattern.exec(url);
        if (match) {
            const groups = aggregateGroups(match);
            for (const [locale, overrideParams] of Object.entries(element.localizedNamedGroups)) {
                let allMatch = true;
                for (const [key, val] of Object.entries(overrideParams)) {
                    const matchedValue = groups[key.replace("?", "")];
                    // Handle nullable parameters
                    if (val === null) {
                        if (matchedValue != null) {
                            allMatch = false;
                            break;
                        }
                    }
                    // Handle wildcard arrays
                    else if (Array.isArray(val)) {
                        const matchedArray = matchedValue?.split("/") ?? [];
                        if (JSON.stringify(matchedArray) !== JSON.stringify(val)) {
                            allMatch = false;
                            break;
                        }
                    }
                    // Handle regular parameters
                    else if (matchedValue && matchedValue !== val) {
                        allMatch = false;
                        break;
                    }
                }
                if (allMatch) {
                    return assertIsLocale(locale);
                }
            }
        }
    }
    return undefined;
}
/**
 * https://github.com/opral/inlang-paraglide-js/issues/381
 *
 * @param {URL|string} url - The full URL from which to extract the locale.
 * @returns {Locale|undefined} The extracted locale, or undefined if no locale is found.
 */
function defaultUrlPatternExtractLocale(url) {
    const urlObj = new URL(url, "http://dummy.com");
    const pathSegments = urlObj.pathname.split("/").filter(Boolean);
    if (pathSegments.length > 0) {
        const potentialLocale = pathSegments[0];
        if (isLocale(potentialLocale)) {
            return potentialLocale;
        }
    }
    // everything else has to be the base locale
    return baseLocale;
}

/**
 * Lower-level URL localization function, primarily used in server contexts.
 *
 * This function is designed for server-side usage where you need precise control
 * over URL localization, such as in middleware or request handlers. It works with
 * URL objects and always returns absolute URLs.
 *
 * For client-side UI components, use `localizeHref()` instead, which provides
 * a more convenient API with relative paths and automatic locale detection.
 *
 * @example
 * ```typescript
 * // Server middleware example
 * app.use((req, res, next) => {
 *   const url = new URL(req.url, `${req.protocol}://${req.headers.host}`);
 *   const localized = localizeUrl(url, { locale: "de" });
 *
 *   if (localized.href !== url.href) {
 *     return res.redirect(localized.href);
 *   }
 *   next();
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Using with URL patterns
 * const url = new URL("https://example.com/about");
 * localizeUrl(url, { locale: "de" });
 * // => URL("https://example.com/de/about")
 *
 * // Using with domain-based localization
 * const url = new URL("https://example.com/store");
 * localizeUrl(url, { locale: "de" });
 * // => URL("https://de.example.com/store")
 * ```
 *
 * @param {string | URL} url - The URL to localize. If string, must be absolute.
 * @param {Object} [options] - Options for localization
 * @param {string} [options.locale] - Target locale. If not provided, uses getLocale()
 * @returns {URL} The localized URL, always absolute
 */
export function localizeUrl(url, options) {
    if (TREE_SHAKE_DEFAULT_URL_PATTERN_USED) {
        return localizeUrlDefaultPattern(url, options);
    }
    const locale = options?.locale ?? getLocale();
    const urlObj = typeof url === "string" ? new URL(url) : url;
    for (const element of urlPatterns) {
        const pattern = new URLPattern(element.pattern);
        const match = pattern.exec(urlObj.href);
        if (match) {
            const groups = aggregateGroups(match);
            for (const [groupName, value] of Object.entries(element.localizedNamedGroups?.[locale] ?? {})) {
                if (groupName.endsWith("?") &&
                    groups[groupName.replace("?", "")] === undefined) {
                    continue;
                }
                groups[groupName.replace("?", "")] = value;
            }
            const url = fillPattern(element.pattern, groups);
            return fillMissingUrlParts(url, match);
        }
    }
    throw new Error(`No match found for ${url}`);
}
/**
 * https://github.com/opral/inlang-paraglide-js/issues/381
 *
 * @param {string | URL} url
 * @param {Object} [options]
 * @param {string} [options.locale]
 * @returns {URL}
 */
function localizeUrlDefaultPattern(url, options) {
    const urlObj = typeof url === "string" ? new URL(url, getUrlOrigin()) : new URL(url);
    const locale = options?.locale ?? getLocale();
    const currentLocale = extractLocaleFromUrl(urlObj);
    // If current locale matches target locale, no change needed
    if (currentLocale === locale) {
        return urlObj;
    }
    const pathSegments = urlObj.pathname.split("/").filter(Boolean);
    // If current path starts with a locale, remove it
    if (pathSegments.length > 0 && isLocale(pathSegments[0])) {
        pathSegments.shift();
    }
    // For base locale, don't add prefix
    if (locale === baseLocale) {
        urlObj.pathname = "/" + pathSegments.join("/");
    }
    else {
        // For other locales, add prefix
        urlObj.pathname = "/" + locale + "/" + pathSegments.join("/");
    }
    return urlObj;
}
/**
 * Low-level URL de-localization function, primarily used in server contexts.
 *
 * This function is designed for server-side usage where you need precise control
 * over URL de-localization, such as in middleware or request handlers. It works with
 * URL objects and always returns absolute URLs.
 *
 * For client-side UI components, use `deLocalizeHref()` instead, which provides
 * a more convenient API with relative paths.
 *
 * @example
 * ```typescript
 * // Server middleware example
 * app.use((req, res, next) => {
 *   const url = new URL(req.url, `${req.protocol}://${req.headers.host}`);
 *   const baseUrl = deLocalizeUrl(url);
 *
 *   // Store the base URL for later use
 *   req.baseUrl = baseUrl;
 *   next();
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Using with URL patterns
 * const url = new URL("https://example.com/de/about");
 * deLocalizeUrl(url); // => URL("https://example.com/about")
 *
 * // Using with domain-based localization
 * const url = new URL("https://de.example.com/store");
 * deLocalizeUrl(url); // => URL("https://example.com/store")
 * ```
 *
 * @param {string | URL} url - The URL to de-localize. If string, must be absolute.
 * @returns {URL} The de-localized URL, always absolute
 */
export function deLocalizeUrl(url) {
    if (TREE_SHAKE_DEFAULT_URL_PATTERN_USED) {
        return deLocalizeUrlDefaultPattern(url);
    }
    const urlObj = new URL(url, getUrlOrigin());
    for (const element of urlPatterns) {
        const pattern = new URLPattern(element.pattern);
        const match = pattern.exec(urlObj.href);
        if (match) {
            const groups = aggregateGroups(match);
            for (const [groupName, value] of Object.entries(element.deLocalizedNamedGroups)) {
                if (groupName.endsWith("?") &&
                    groups[groupName.replace("?", "")] === undefined) {
                    continue;
                }
                groups[groupName.replace("?", "")] = value;
            }
            const url = fillPattern(element.pattern, groups);
            return fillMissingUrlParts(url, match);
        }
    }
    throw new Error(`No match found for ${url}`);
}
/**
 * De-localizes a URL using the default pattern (/:locale/*)
 * @param {string|URL} url
 * @returns {URL}
 */
function deLocalizeUrlDefaultPattern(url) {
    const urlObj = typeof url === "string" ? new URL(url, getUrlOrigin()) : new URL(url);
    const pathSegments = urlObj.pathname.split("/").filter(Boolean);
    // If first segment is a locale, remove it
    if (pathSegments.length > 0 && isLocale(pathSegments[0])) {
        urlObj.pathname = "/" + pathSegments.slice(1).join("/");
    }
    return urlObj;
}
/**
 * Takes matches of implicit wildcards in the UrlPattern (when a part is missing
 * it is equal to '*') and adds them back to the result of fillPattern.
 *
 * At least protocol and hostname are required to create a valid URL inside fillPattern.
 *
 * @param {URL} url
 * @param {any} match
 * @returns {URL}
 */
function fillMissingUrlParts(url, match) {
    if (match.username.groups["0"]) {
        url.username = match.username.groups["0"] ?? "";
    }
    if (match.password.groups["0"]) {
        url.password = match.password.groups["0"] ?? "";
    }
    if (match.port.groups["0"]) {
        url.port = match.port.groups["0"] ?? "";
    }
    if (match.pathname.groups["0"]) {
        url.pathname = match.pathname.groups["0"] ?? "";
    }
    if (match.search.groups["0"]) {
        url.search = match.search.groups["0"] ?? "";
    }
    if (match.hash.groups["0"]) {
        url.hash = match.hash.groups["0"] ?? "";
    }
    return url;
}
/**
 * Fills a URL pattern with values for named groups, supporting all URLPattern-style modifiers:
 *
 * This function will eventually be replaced by https://github.com/whatwg/urlpattern/issues/73
 *
 * Matches:
 * - :name        -> Simple
 * - :name?       -> Optional
 * - :name+       -> One or more
 * - :name*       -> Zero or more
 * - :name(...)   -> Regex group
 *
 * If the value is `null`, the segment is removed.
 *
 * @param {string} pattern - The URL pattern containing named groups.
 * @param {Record<string, string | null | undefined>} values - Object of values for named groups.
 * @returns {URL} - The constructed URL with named groups filled.
 */
function fillPattern(pattern, values) {
    const filled = pattern.replace(/(\/?):([a-zA-Z0-9_]+)(\([^)]*\))?([?+*]?)/g, (_, slash, name, __, modifier) => {
        const value = values[name];
        if (value === null) {
            // If value is null, remove the entire segment including the preceding slash
            return "";
        }
        if (modifier === "?") {
            // Optional segment
            return value !== undefined ? `${slash}${value}` : "";
        }
        if (modifier === "+" || modifier === "*") {
            // Repeatable segments
            if (value === undefined && modifier === "+") {
                throw new Error(`Missing value for "${name}" (one or more required)`);
            }
            return value ? `${slash}${value}` : "";
        }
        // Simple named group (no modifier)
        if (value === undefined) {
            throw new Error(`Missing value for "${name}"`);
        }
        return `${slash}${value}`;
    });
    return new URL(filled);
}
/**
 * Aggregates named groups from various parts of the URLPattern match result.
 *
 *
 * @type {(match: any) => Record<string, string | null | undefined>}
 */
export function aggregateGroups(match) {
    return {
        ...match.hash.groups,
        ...match.hostname.groups,
        ...match.password.groups,
        ...match.pathname.groups,
        ...match.port.groups,
        ...match.protocol.groups,
        ...match.search.groups,
        ...match.username.groups,
    };
}

/**
 * High-level URL localization function optimized for client-side UI usage.
 *
 * This is a convenience wrapper around `localizeUrl()` that provides features
 * needed in UI:
 *
 * - Accepts relative paths (e.g., "/about")
 * - Returns relative paths when possible
 * - Automatically detects current locale if not specified
 * - Handles string input/output instead of URL objects
 *
 * @example
 * ```typescript
 * // In a React/Vue/Svelte component
 * const NavLink = ({ href }) => {
 *   // Automatically uses current locale, keeps path relative
 *   return <a href={localizeHref(href)}>...</a>;
 * };
 *
 * // Examples:
 * localizeHref("/about")
 * // => "/de/about" (if current locale is "de")
 * localizeHref("/store", { locale: "fr" })
 * // => "/fr/store" (explicit locale)
 *
 * // Cross-origin links remain absolute
 * localizeHref("https://other-site.com/about")
 * // => "https://other-site.com/de/about"
 * ```
 *
 * For server-side URL localization (e.g., in middleware), use `localizeUrl()`
 * which provides more precise control over URL handling.
 *
 * @param {string} href - The href to localize (can be relative or absolute)
 * @param {Object} [options] - Options for localization
 * @param {string} [options.locale] - Target locale. If not provided, uses `getLocale()`
 * @returns {string} The localized href, relative if input was relative
 */
export function localizeHref(href, options) {
    const locale = options?.locale ?? getLocale();
    const url = new URL(href, getUrlOrigin());
    const localized = localizeUrl(url, options);
    // if the origin is identical and the href is relative,
    // return the relative path
    if (href.startsWith("/") && url.origin === localized.origin) {
        // check for cross origin localization in which case an absolute URL must be returned.
        if (locale !== getLocale()) {
            const localizedCurrentLocale = localizeUrl(url, { locale: getLocale() });
            if (localizedCurrentLocale.origin !== localized.origin) {
                return localized.href;
            }
        }
        return localized.pathname + localized.search + localized.hash;
    }
    return localized.href;
}
/**
 * High-level URL de-localization function optimized for client-side UI usage.
 *
 * This is a convenience wrapper around `deLocalizeUrl()` that provides features
 * needed in the UI:
 *
 * - Accepts relative paths (e.g., "/de/about")
 * - Returns relative paths when possible
 * - Handles string input/output instead of URL objects
 *
 * @example
 * ```typescript
 * // In a React/Vue/Svelte component
 * const LocaleSwitcher = ({ href }) => {
 *   // Remove locale prefix before switching
 *   const baseHref = deLocalizeHref(href);
 *   return locales.map(locale =>
 *     <a href={localizeHref(baseHref, { locale })}>
 *       Switch to {locale}
 *     </a>
 *   );
 * };
 *
 * // Examples:
 * deLocalizeHref("/de/about")  // => "/about"
 * deLocalizeHref("/fr/store")  // => "/store"
 *
 * // Cross-origin links remain absolute
 * deLocalizeHref("https://example.com/de/about")
 * // => "https://example.com/about"
 * ```
 *
 * For server-side URL de-localization (e.g., in middleware), use `deLocalizeUrl()`
 * which provides more precise control over URL handling.
 *
 * @param {string} href - The href to de-localize (can be relative or absolute)
 * @returns {string} The de-localized href, relative if input was relative
 * @see deLocalizeUrl - For low-level URL de-localization in server contexts
 */
export function deLocalizeHref(href) {
    const url = new URL(href, getUrlOrigin());
    const deLocalized = deLocalizeUrl(url);
    // If the origin is identical and the href is relative,
    // return the relative path instead of the full URL.
    if (href.startsWith("/") && url.origin === deLocalized.origin) {
        return deLocalized.pathname + deLocalized.search + deLocalized.hash;
    }
    return deLocalized.href;
}

/**
 * @param {string} safeModuleId
 * @param {Locale} locale
 */
export function trackMessageCall(safeModuleId, locale) {
    if (isServer === false)
        return;
    const store = serverAsyncLocalStorage?.getStore();
    if (store) {
        store.messageCalls?.add(`${safeModuleId}:${locale}`);
    }
}

// ------ TYPES ------

/**
 * A locale that is available in the project.
 *
 * @example
 *   setLocale(request.locale as Locale)
 *
 * @typedef {(typeof locales)[number]} Locale
 */

