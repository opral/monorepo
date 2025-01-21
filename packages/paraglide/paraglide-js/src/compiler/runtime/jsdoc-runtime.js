import fs from "node:fs";

/**
 * Load a file from the current directory.
 * 
 * @param {string} path 
 * @returns {string}
 */
const injectCode = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf-8");  

// to modify the runtime, outcomment the export const jsdocRuntime line

export const jsdocRuntime = `
// @eslint-disable

/**
 * The project's base locale.
 *
 * @example
 *   if (locale === baseLocale) {
 *     // do something
 *   }
 */
export const baseLocale = "<replace>";

/**
 * The project's locales that have been specified in the settings.
 *
 * @example
 *   if (locales.includes(userSelectedLocale) === false) {
 *     throw new Error('Locale is not available');
 *   }
 */
export const locales = /** @type {const} */ (["<replace>"]);

/**
 * This is a default implementation that is almost always
 * overwritten by \`defineGetLocale()\` and \`defineSetLocale()\`.
 *
 * @type {Locale}
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
 * @param {() => Locale} fn
 * @type {(fn: () => Locale) => void}
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
 * @param {(newLocale: Locale) => void} fn
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
 * @type {() => Locale}
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
 * @param {Locale} newLocale
 * @type {(newLocale: Locale) => void}
 */
export let setLocale =
	/** default implementation likely overwritten by \`defineSetLocale()\` */ (
		newLocale
	) => {
		_locale = newLocale;
	};

${injectCode("./is-locale.js")}

${injectCode("./get-locale-from-path.js")}

${injectCode("./localized-path.js")}

${injectCode("./delocalized-path.js")}

// ------ TYPES ------

/**
 * A locale that is available in the project.
 *
 * @example
 *   setLocale(request.locale as Locale)
 *
 * @typedef {(typeof locales)[number]} Locale
 */

`;
