import { KEYWORDS } from "./reservedWords.js"

/**
 * Checks if a string is a valid JS identifier.
 * This is more reliable than just using regexes or `new Function()`.s
 * @param {string} str
 * @returns {boolean}
 */
export function isValidJSIdentifier(str) {
	return !KEYWORDS.includes(str) && canBeUsedAsVariableName(str)
}

/**
 * is-var-name | ISC (c) Shinnosuke Watanabe
 * https://github.com/shinnn/is-var-name
 *
 * @param {string} str
 * @returns {boolean}
 */
function canBeUsedAsVariableName(str) {
	if (str.trim() !== str) {
		return false
	}

	try {
		new Function(str, "var " + str)
	} catch (_) {
		return false
	}

	return true
}
