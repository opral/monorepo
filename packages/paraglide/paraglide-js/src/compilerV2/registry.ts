export function createRegistry() {
	return `/* eslint-disable */

/**
 * @param {import("./runtime.js").AvailableLanguageTag} lang
 * @param {number} input
 * @param {object} [options]
 * @param {"cardinal" | "ordinal"} [options.type="cardinal"] 
 * @returns {"zero" | "one" | "two" | "few" | "many" | "other"}
 */
export function plural(lang, input, options) {
    const formatter = new Intl.PluralRules(lang, options)
    return formatter.select(input)
}`
}
