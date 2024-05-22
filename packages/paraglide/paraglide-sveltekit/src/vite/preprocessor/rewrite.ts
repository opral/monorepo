import { NO_TRANSLATE_ATTRIBUTE } from "../../constants.js"
import type { TranslationDefinition } from "./index.js"
import { getAttributeByName, getElementsFromAst } from "./utils/ast.js"
import { attrubuteValuesToJSValue } from "./utils/attributes-to-values.js"
import { identifier } from "./utils/identifier.js"
import { uneval } from "devalue"
import * as c from "./utils/codegen.js"
import type { Attribute, ElementNode, SpreadAttribute } from "./types.js"
import type MagicString from "magic-string"
import type { LegacyRoot } from "svelte/compiler"

const i = identifier(`translate_attribute_pass`)

export const rewrite = ({
	root: ast,
	code,
	originalCode,
	translations,
}: {
	root: LegacyRoot
	code: MagicString
	originalCode: string
	translations: TranslationDefinition
}) => {
	if (hasAlreadyBeenRewritten(originalCode))
		return {
			scriptAdditions: {
				before: [],
				after: [],
			},
		}

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
							`${i("translateAttribute")}(${attrubuteValuesToJSValue(
								attribute.value,
								originalCode
							)},${
								langAttribute
									? attrubuteValuesToJSValue(langAttribute.value, originalCode)
									: "undefined"
							})`,
							attrubuteValuesToJSValue(attribute.value, originalCode)
						)
					)

					//replace the attribute with the new attribute
					code.overwrite(attribute.start, attribute.end, newAttributeCode)
				}
			}
		}
	}

	const before = [
		`import { getTranslationFunctions as ${i(
			"getTranslationFunctions"
		)} } from '@inlang/paraglide-sveltekit/internal';`,
	]
	const after: string[] = [
		`const ${i("translationFunctions")} = ${i("getTranslationFunctions")}();\nconst [ ${i(
			"translateAttribute"
		)}, ${i("handle_attributes")} ] = ${i("translationFunctions")};`,
	]

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

/**
 * Protection measure to make sure we don't rewrite the same code twice
 * @param originalCode
 */
function hasAlreadyBeenRewritten(originalCode: string): boolean {
	return originalCode.includes(i("getTranslationFunctions"))
}
