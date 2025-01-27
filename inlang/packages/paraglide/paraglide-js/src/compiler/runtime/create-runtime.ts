import type { ProjectSettings } from "@inlang/sdk";
import fs from "node:fs";

/**
 * Returns the code for the `runtime.js` module
 */
export function createRuntime(
	settings: Pick<ProjectSettings, "baseLocale" | "locales">
): string {
	return (
		jsdocRuntime
			// replace the locales first
			.replace('["<replace>"]', JSON.stringify(settings.locales))
			// then the base locale
			.replaceAll('"<replace>"', JSON.stringify(settings.baseLocale))
	);
}

const jsdocRuntime = `
import * as strategy from "./strategy.js";

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

${injectCode("./get-locale.js")} 

${injectCode("./set-locale.js")}

${injectCode("./is-locale.js")}

${injectCode("./assert-is-locale.js")}

${injectCode("./locale-in-path.js")}

${injectCode("./localize-path.js")}

${injectCode("./de-localize-path.js")}

${injectCode("./detect-locale-from-request.js")}

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

/**
 * Load a file from the current directory.
 *
 * @param {string} path
 * @returns {string}
 */
function injectCode(path: string): string {
	return fs.readFileSync(new URL(path, import.meta.url), "utf-8");
}