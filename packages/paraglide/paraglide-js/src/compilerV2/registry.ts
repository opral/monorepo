export function createRegistry() {
	return `/* eslint-disable */

/**
 * @param {import("./runtime.js").AvailableLanguageTag} lang
 * @param {number} input
 * @param {{ type: "cardinal" | "ordinal" }} options
 * @returns {string}
 */
export function plural(lang, input, options) {
    const formatter = new Intl.PluralRules(lang, options)
    return formatter.select(input)
}`
}
