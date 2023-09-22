import * as messages from "./messages.js"

export const sourceLanguageTag = "en"

/**
 * @type {import("@inlang/sdk").LanguageTag}
 */
let _currentLanguageTag

/**
 *
 * @returns {import("@inlang/sdk").LanguageTag}
 */
export const currentLanguageTag = () => {
	return _currentLanguageTag
}

/**
 *
 * @param {import("@inlang/sdk").LanguageTag} tag
 */
export const setCurrentLanguageTag = async (tag) => {
	_currentLanguageTag = tag
}

/**
 *
 * @param {string} id
 */
/*#__NO_SIDE_EFFECTS__*/
export const m = (id) => {
	/*#__PURE__*/
	// @ts-ignore
	return messages[id]
}
