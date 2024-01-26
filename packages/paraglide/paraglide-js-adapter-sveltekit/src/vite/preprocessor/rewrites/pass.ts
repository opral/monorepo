import { PARAGLIDE_CONTEXT_KEY } from "../../../runtime/constants.js"
import type { PreprocessingPass } from "../index.js"
import { getAttributeByName, getElementsFromAst } from "../utils/ast.js"
import { attrubuteValuesToJSValue } from "../utils/attributes-to-values.js"
import { identifier } from "../utils/identifier.js"
import { uneval } from "devalue"
import * as c from "../utils/codegen.js"
import dedent from "dedent"
import type { ElementNode } from "../types.js"

export type AttributeTranslation = {
	attribute_name: string
	lang_attribute_name?: string
}

export type TranslationDefinition = Record<string, AttributeTranslation[]>

export function createTranslateAttributePass(
	TRANSLATIONS: TranslationDefinition
): PreprocessingPass {
	return {
		condition: ({ content }) => {
			const includesSpread = content.includes("{...")
			const includesSvelteElement = content.includes("<svelte:element")

			for (const [element_name, attribute_translations] of Object.entries(TRANSLATIONS)) {
				const includesElement = content.includes(element_name)
				const includesAttribute = attribute_translations.some((tr) =>
					content.includes(tr.attribute_name)
				)

				if ((includesSpread || includesAttribute) && (includesElement || includesSvelteElement)) {
					return true
				}
			}

			return false
		},

		apply: ({ ast, code, originalCode }) => {
			const i = identifier(`translate_attribute_pass`)

			const svelteElements = getElementsFromAst(ast, "svelte:element")

			for (const [element_name, attribute_translations] of Object.entries(TRANSLATIONS)) {
				const elements = [...getElementsFromAst(ast, element_name)]

				for (const element of elements) {
					if (hasSpreadAttribute(element)) {
						const attributeEntries: string[] = []
						const replacedAttributes = new Set<(typeof element.attributes)[number]>()

						for (const attribute of element.attributes) {
							switch (attribute.type) {
								case "Attribute": {
									attributeEntries.push(
										`${c.str(attribute.name)} : ${attrubuteValuesToJSValue(
											attribute.value,
											originalCode
										)}`
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

						const attributes = `{${attributeEntries.join(", ")}}`

						if (replacedAttributes.size === 0) continue

						// remove the replaced attributes from the code
						for (const attribute of replacedAttributes) {
							code.remove(attribute.start, attribute.end)
						}

						// add a new spread attribute at the end of the element
						const newSpreadAttributeString = c.spreadAttr(
							`${i("handle_attributes")}(${attributes}, ${uneval(attribute_translations)})`
						)

						code.appendRight(
							element.start + element.name.length + 1,
							" " + newSpreadAttributeString
						)
					} else {
						for (const [element_name, attribute_translations] of Object.entries(TRANSLATIONS)) {
							for (const { attribute_name, lang_attribute_name } of attribute_translations) {
								const attribute = getAttributeByName(element, attribute_name)
								if (!attribute) continue

								if (getAttributeByName(element, "data-no-translate")) continue

								const langAttribute = lang_attribute_name
									? getAttributeByName(element, lang_attribute_name)
									: undefined

								const newAttributeCode = c.attribute(
									attribute_name,

									`${i("translateAttribute")}(
													${attrubuteValuesToJSValue(attribute.value, originalCode)},
													${langAttribute ? attrubuteValuesToJSValue(langAttribute.value, originalCode) : "undefined"}
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
					const attributeEntries: string[] = []
					const replacedAttributes = new Set<(typeof element.attributes)[number]>()

					for (const attribute of element.attributes) {
						switch (attribute.type) {
							case "Attribute": {
								attributeEntries.push(
									`${c.str(attribute.name)} : ${attrubuteValuesToJSValue(
										attribute.value,
										originalCode
									)}`
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

					const attributes = `{${attributeEntries.join(", ")}}`
					if (replacedAttributes.size === 0) continue

					// remove the replaced attributes from the code
					for (const attribute of replacedAttributes) {
						code.remove(attribute.start, attribute.end)
					}

					let value = attributes
					for (const [element_name, attribute_translations] of Object.entries(TRANSLATIONS)) {
						value = c.ternary(
							c.eq(thisValue, c.str(element_name)),
							`${i("handle_attributes")}(${attributes}, ${uneval(attribute_translations)})`,
							value
						)
					}

					// add a new spread attribute at the end of the element
					const newSpreadAttributeString = c.spreadAttr(value)

					code.appendRight(element.start + element.name.length + 1, " " + newSpreadAttributeString)
				} else {
					for (const [element_name, attribute_translations] of Object.entries(TRANSLATIONS)) {
						for (const { attribute_name, lang_attribute_name } of attribute_translations) {
							const attribute = getAttributeByName(element, attribute_name)
							if (!attribute) continue

							if (getAttributeByName(element, "data-no-translate")) continue

							const langAttribute = lang_attribute_name
								? getAttributeByName(element, lang_attribute_name)
								: undefined

							const newAttributeCode = c.attribute(
								attribute_name,
								c.ternary(
									c.eq(thisValue, c.str(element_name)),
									`${i("translateAttribute")}(
												${attrubuteValuesToJSValue(attribute.value, originalCode)},
												${langAttribute ? attrubuteValuesToJSValue(langAttribute.value, originalCode) : "undefined"}
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
						//If the element has the data-no-translate attribute, don't translate it
						if(attrs["data-no-translate"] === true) return attrs;

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
		},
	}
}

function hasSpreadAttribute(element: ElementNode<string>): boolean {
	return element.attributes.some((attribute) => attribute.type === "Spread")
}
