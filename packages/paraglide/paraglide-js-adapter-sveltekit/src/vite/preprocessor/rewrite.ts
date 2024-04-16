import { NO_TRANSLATE_ATTRIBUTE, PARAGLIDE_CONTEXT_KEY } from "../../constants.js"
import type { TranslationDefinition } from "./index.js"
import { getAttributeByName, getElementsFromAst } from "./utils/ast.js"
import { attrubuteValuesToJSValue } from "./utils/attributes-to-values.js"
import { identifier } from "./utils/identifier.js"
import { uneval } from "devalue"
import * as c from "./utils/codegen.js"
import dedent from "dedent"
import type { Ast, Attribute, ElementNode, SpreadAttribute } from "./types.js"
import type MagicString from "magic-string"

const i = identifier(`translate_attribute_pass`)

export const rewrite = ({
	ast,
	code,
	originalCode,
	translations,
}: {
	ast: Ast
	code: MagicString
	originalCode: string
	translations: TranslationDefinition
}) => {
	const svelteElements = getElementsFromAst(ast, "svelte:element")

	for (const [element_name, attribute_translations] of Object.entries(translations)) {
		const elements = [...getElementsFromAst(ast, element_name)]

		for (const element of elements) {
			if (hasSpreadAttribute(element)) {
				const { attributeObjectSource, attributes } = getAttributesObject(element, originalCode)
				if (attributes.size === 0) continue //fast path

				// add a new spread attribute at the end of the element
				const newSpreadAttributeString = c.spreadAttr(
					`${i("handle_attributes")}(${attributeObjectSource}, ${uneval(attribute_translations)})`
				)

				// remove all attributes that were replaced from the code
				for (const attribute of attributes) {
					code.remove(attribute.start, attribute.end)
				}

				//Add the new spread attribute
				code.appendRight(element.start + element.name.length + 1, " " + newSpreadAttributeString)

				//add <!-- svelte-ignore a11y-missing-attribute --> just before the element
				code.appendLeft(element.start, "<!-- svelte-ignore a11y-missing-attribute -->")
			} else {
				for (const element_translations of Object.entries(translations)) {
					const attribute_translations = element_translations[1]
					for (const { attribute_name, lang_attribute_name } of attribute_translations) {
						const attribute = getAttributeByName(element, attribute_name)
						if (!attribute) continue

						if (getAttributeByName(element, NO_TRANSLATE_ATTRIBUTE)) continue

						const langAttribute = lang_attribute_name
							? getAttributeByName(element, lang_attribute_name)
							: undefined

						const newAttributeCode = c.attribute(
							attribute_name,

							`${i("translateAttribute")}(
                                            ${attrubuteValuesToJSValue(
																							attribute.value,
																							originalCode
																						)},
                                            ${
																							langAttribute
																								? attrubuteValuesToJSValue(
																										langAttribute.value,
																										originalCode
																								  )
																								: "undefined"
																						}
                                        )`
						)

						//replace the attribute with the new attribute
						code.overwrite(attribute.start, attribute.end, newAttributeCode)
					}
				}
			}
		}
	}

	for (const element of svelteElements) {
		const thisAttribute = element.tag
		if (!thisAttribute) continue

		const thisValue =
			typeof thisAttribute === "string"
				? c.str(thisAttribute)
				: "`${" + originalCode.slice(thisAttribute.start, thisAttribute.end) + "}`"

		if (hasSpreadAttribute(element)) {
			const { attributeObjectSource, attributes } = getAttributesObject(element, originalCode)
			if (attributes.size === 0) continue //fast path

			// builds a giant ternary expression that applies the translated attributes based on the thisAttribute
			let value = attributeObjectSource
			for (const [element_name, attribute_translations] of Object.entries(translations)) {
				value = c.ternary(
					c.eq(thisValue, c.str(element_name)),
					`${i("handle_attributes")}(${attributeObjectSource}, ${uneval(attribute_translations)})`,
					value
				)
			}

			// remove the replaced attributes from the code
			for (const attribute of attributes) {
				code.remove(attribute.start, attribute.end)
			}

			// add a new spread attribute at the end of the element
			const newSpreadAttributeString = c.spreadAttr(value)

			code.appendRight(element.start + element.name.length + 1, " " + newSpreadAttributeString)

			//add <!-- svelte-ignore a11y-missing-attribute --> just before the element
			code.appendLeft(element.start, "<!-- svelte-ignore a11y-missing-attribute -->")
		} else {
			for (const [element_name, attribute_translations] of Object.entries(translations)) {
				for (const { attribute_name, lang_attribute_name } of attribute_translations) {
					const attribute = getAttributeByName(element, attribute_name)
					if (!attribute) continue

					if (getAttributeByName(element, NO_TRANSLATE_ATTRIBUTE)) continue

					const langAttribute = lang_attribute_name
						? getAttributeByName(element, lang_attribute_name)
						: undefined

					const newAttributeCode = c.attribute(
						attribute_name,
						c.ternary(
							c.eq(thisValue, c.str(element_name)),
							`${i("translateAttribute")}(
                                        ${attrubuteValuesToJSValue(attribute.value, originalCode)},
                                        ${
																					langAttribute
																						? attrubuteValuesToJSValue(
																								langAttribute.value,
																								originalCode
																						  )
																						: "undefined"
																				}
                                    )`,
							attrubuteValuesToJSValue(attribute.value, originalCode)
						)
					)

					//replace the attribute with the new attribute
					code.overwrite(attribute.start, attribute.end, newAttributeCode)
				}
			}
		}
	}

	const before: string[] = []
	const after: string[] = []

	before.push(`import { getContext as ${i("getContext")} } from 'svelte';`)

	after.push(
		dedent`
            const ${i("context")} = ${i("getContext")}('${PARAGLIDE_CONTEXT_KEY}');
        
            /**
             * @param {string} value
             * @param {string | undefined} lang_value
             */
            function ${i("translateAttribute")}(value, lang_value) {
				if(typeof value !== "string") return value;
                if(!${i("context")}) return value;
                return ${i("context")}.translateHref(value, lang_value);
            }

            /**
             * @typedef {{ attribute_name: string, lang_attribute_name?: string }} AttributeTranslation
             */

            /**
             * Takes in an object of attributes, and an object of attribute translations
             * & applies the translations to the attributes
             * 
             * @param {Record<string, any>} attrs
             * @param {AttributeTranslation[]} attribute_translations
             */
            function ${i("handle_attributes")}(attrs, attribute_translations) {
                //If the element has the ${NO_TRANSLATE_ATTRIBUTE} attribute, don't translate it
                if(attrs[${c.str(NO_TRANSLATE_ATTRIBUTE)}] === true) return attrs;

                for (const { attribute_name, lang_attribute_name } of attribute_translations){
                    if(attribute_name in attrs) {
                        const attr = attrs[attribute_name];
                        const lang_attr = lang_attribute_name ? attrs[lang_attribute_name] : undefined;
                        attrs[attribute_name] = ${i("translateAttribute")}(attr, lang_attr);
                    }
                }

                return attrs;
            }`
	)

	return {
		scriptAdditions: {
			before,
			after,
		},
	}
}

function getAttributesObject(
	element: ElementNode<string>,
	originalCode: string
): {
	attributes: Set<Attribute<string> | SpreadAttribute>
	attributeObjectSource: string
} {
	const attributeEntries: string[] = []
	const replacedAttributes = new Set<Attribute<string> | SpreadAttribute>()

	for (const attribute of element.attributes) {
		switch (attribute.type) {
			case "Attribute": {
				attributeEntries.push(
					`${c.str(attribute.name)} : ${attrubuteValuesToJSValue(attribute.value, originalCode)}`
				)
				replacedAttributes.add(attribute)
				break
			}
			case "Spread": {
				const code: string = originalCode.slice(
					//@ts-ignore
					attribute.expression.start,
					//@ts-ignore
					attribute.expression.end
				)

				attributeEntries.push(`...(${code})`)
				replacedAttributes.add(attribute)
				break
			}
		}
	}

	return {
		attributes: replacedAttributes,
		attributeObjectSource: `{${attributeEntries.join(", ")}}`,
	}
}

function hasSpreadAttribute(element: ElementNode<string>): boolean {
	return element.attributes.some((attribute) => attribute.type === "Spread")
}
