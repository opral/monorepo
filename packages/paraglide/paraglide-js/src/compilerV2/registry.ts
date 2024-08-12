export function createRegistry() {
	return `/* eslint-disable */

/**
 * @param {import("./runtime.js").AvailableLanguageTag} locale
 * @param {number} input
 * @param {object} [options]
 * @param {"cardinal" | "ordinal"} [options.type="cardinal"] 
 * @returns {string}
 */
export const plural = (locale, input, options) =>  new Intl.PluralRules(locale, options).select(input)`
}
