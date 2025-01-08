import type { ProjectSettings } from "@inlang/sdk";

/**
 * Returns the code for the `runtime.js` module
 */
export function createRuntime(
	args: Pick<ProjectSettings, "baseLocale" | "locales">
): string {
	return `/* eslint-disable */

/**
 * The project's base locale.
 *
 * @example
 *   if (locale === baseLocale) {
 *     // do something
 *   }
 */
export const baseLocale = "${args.baseLocale}";

/**
 * The project's locales.
 *
 * @example
 *   if (locales.includes(userSelectedLocale) === false) {
 *     throw new Error('Locale is not available');
 *   }
 */
export const locales = /** @type {const} */ (${JSON.stringify(args.locales)});

/**
 * This is a default implementation that is almost always
 * overwritten by \`defineGetLocale()\` and \`defineSetLocale()\`.
 *
 * @type {AvailableLocale}
 */
let _locale = baseLocale;

/**
 * Define the \`getLocale()\` function.
 *
 * Use this function to define how the locale is resolved. For example,
 * you can resolve the locale from the browser's preferred language,
 * a cookie, env variable, or a user's preference.
 *
 * @example
 *   defineGetLocale(() => {
 *     // resolve the locale from a cookie. fallback to the base locale.
 *     return Cookies.get('locale') ?? baseLocale
 *   }
 *
 * @param {() => AvailableLocale} fn
 * @type {(fn: () => AvailableLocale) => void}
 */
export const defineGetLocale = (fn) => {
	getLocale = fn;
};

/**
 * Define the \`setLocale()\` function.
 *
 * Use this function to define how the locale is set. For example,
 * modify a cookie, env variable, or a user's preference.
 *
 * @example
 *   defineSetLocale((newLocale) => {
 *     // set the locale in a cookie
 *     return Cookies.set('locale', newLocale)
 *   });
 *
 * @param {(newLocale: AvailableLocale) => void} fn
 */
export const defineSetLocale = (fn) => {
	setLocale = fn;
};

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
 * @type {() => AvailableLocale}
 */
export let getLocale =
	/** default implementation likely overwritten by \`defineGetLocale()\` */ () =>
		_locale;

/**
 * Set the locale.
 *
 * @example
 *   setLocale('en');
 *
 * @param {AvailableLocale} newLocale
 * @type {(newLocale: AvailableLocale) => void}
 */
export let setLocale =
	/** default implementation likely overwritten by \`defineSetLocale()\` */ (
		newLocale
	) => {
		_locale = newLocale;
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
 * @returns {locale is AvailableLocale}
 */
export function isAvailableLocale(locale) {
	return locales.includes(locale);
}

// ------ TYPES ------

/**
 * A locale that is available in the project.
 *
 * @example
 *   setLocale(request.locale as AvailableLocale)
 *
 * @typedef {(typeof locales)[number]} AvailableLocale
 */

// ------ LEGACY RUNTIME (will be removed in the next major version) ------

/** @deprecated Use \`baseLocale\` instead */
export const sourceLanguageTag = baseLocale;

/** @deprecated Use \`locales\` instead */
export const availableLanguageTags = locales;

/** @deprecated Use \`getLocale()\` instead */
export let languageTag = getLocale;

/** @deprecated Use \`setLocale()\` instead */
export const setLanguageTag = setLocale;

/**
 * @deprecated Use \`isAvailableLocale()\` instead
 * @returns {thing is AvailableLanguageTag}
 */
export const isAvailableLanguageTag = isAvailableLocale;

/**
 * @deprecated Use \`AvailableLocale\` instead
 * @typedef {(typeof locales)[number]} AvailableLanguageTag
 */
`;
}