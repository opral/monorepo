// this is a JS file to avoid transpiling in tests
import { NO_TRANSLATE_ATTRIBUTE } from "../../constants.js"
import { getContext, setContext } from "svelte"

const PARAGLIDE_CONTEXT_KEY = {}

/**
 * @template {string} T
 * @typedef {{ translateHref: (href: string, hreflang?: T) => string }} ParaglideContext
 */

/**
 * @template {string} T
 * @private
 */
export const getParaglideContext = () => {
	return /** @type { ParaglideContext<T> | undefined}*/ (getContext(PARAGLIDE_CONTEXT_KEY))
}
/**
 * @template {string} T
 * @param {ParaglideContext<T>} context
 * @private
 */
export const setParaglideContext = (context) => {
	setContext(PARAGLIDE_CONTEXT_KEY, context)
}

/**
 * Returns the functions necessary to translate a link component
 *
 * @private
 */
export function getTranslationFunctions() {
	const ctx = getParaglideContext()

	/**
	 * @param {unknown} value
	 * @param { string | undefined} lang_value
	 * @returns
	 */
	function translateAttribute(value, lang_value) {
		if (typeof value !== "string") return value
		if (!ctx) return value
		return ctx.translateHref(value, lang_value)
	}

	/**
	 * @typedef {{
	 *	attribute_name: string
	 *	lang_attribute_name?: string
	 *}} AttributeTranslation
	 */

	/**
	 * Takes in an object of attributes, and an object of attribute translations
	 * & applies the translations to the attributes
	 *
	 * @param {Record<string, unknown>} attrs
	 * @param {AttributeTranslation[]} attribute_translations
	 */
	function handleAttributes(attrs, attribute_translations) {
		if (attrs[NO_TRANSLATE_ATTRIBUTE]) return attrs

		for (const { attribute_name, lang_attribute_name } of attribute_translations) {
			if (attribute_name in attrs) {
				const attr = attrs[attribute_name]
				const lang_attr = lang_attribute_name ? attrs[lang_attribute_name] : undefined

				attrs[attribute_name] = translateAttribute(
					attr,
					typeof lang_attr === "string" ? lang_attr : undefined
				)
			}
		}

		return attrs
	}

	// we use a tuple instead of an object because the names need to be mangled on the other side
	// also this minifies better
	return [translateAttribute, handleAttributes]
}
