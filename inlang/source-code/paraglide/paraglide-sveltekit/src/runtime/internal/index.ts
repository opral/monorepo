import { getParaglideContext } from "./context.js"
import { NO_TRANSLATE_ATTRIBUTE } from "../../constants.js"

/**
 * Returns the functions necessary to translate a link component
 *
 * @private
 */
export function getTranslationFunctions() {
	const ctx = getParaglideContext()

	function translateAttribute(value: unknown, lang_value: string | undefined) {
		if (typeof value !== "string") return value
		if (!ctx) return value
		return ctx.translateHref(value, lang_value)
	}

	type AttributeTranslation = {
		attribute_name: string
		lang_attribute_name?: string
	}

	/**
	 * Takes in an object of attributes, and an object of attribute translations
	 * & applies the translations to the attributes
	 */
	function handleAttributes(
		attrs: Record<string, unknown>,
		attribute_translations: AttributeTranslation[]
	) {
		//If the element has the ${NO_TRANSLATE_ATTRIBUTE} attribute, don't translate it
		if (attrs[NO_TRANSLATE_ATTRIBUTE] === true) return attrs

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
