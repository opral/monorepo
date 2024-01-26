import { PARAGLIDE_CONTEXT_KEY } from "../../../runtime/constants.js"
import type { PreprocessingPass } from "../index.js"
import { getElementsFromAst } from "../utils/ast.js"
import { attrubuteValuesToJSValue } from "../utils/attributes-to-values.js"
import { identifier } from "../utils/identifier.js"
import dedent from "dedent"
import { escapeForDoubleQuotes } from "../utils/escape.js"
import { uneval } from "devalue"

export type AttributeTranslation = {
	element_name: string
	attribute_name: string
	lang_attribute_name?: string
}

export function createTranslateAttributePass(
	attribute_translations: AttributeTranslation[]
): PreprocessingPass {
	return {
		condition: ({ content }) => {
			const includesSpread = content.includes("{...")
			const includesSvelteElement = content.includes("<svelte:element")

			for (const { element_name, attribute_name } of attribute_translations) {
				const includesAttribute = content.includes(attribute_name)
				const includesElement = content.includes(element_name)

				if ((includesSpread || includesAttribute) && (includesElement || includesSvelteElement)) {
					return true
				}
			}

			return false
		},

		apply: ({ ast, code, originalCode }) => {
			const i = identifier(`translate_attribute_pass`)

			const svelteElements = getElementsFromAst(ast, "svelte:element")

			for (const { element_name, attribute_name, lang_attribute_name } of attribute_translations) {
				const elements = [...getElementsFromAst(ast, element_name)]

				//Replace all links with the new links
				for (const element of elements) {
					let attributes = "{"

					const replacedAttributes = new Set<(typeof element.attributes)[number]>()

					for (const attribute of element.attributes) {
						switch (attribute.type) {
							case "Attribute": {
								attributes += `"${escapeForDoubleQuotes(
									attribute.name
								)}": ${attrubuteValuesToJSValue(attribute.value, originalCode)},`
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

								attributes += `...(${code}),`
								replacedAttributes.add(attribute)
								break
							}
						}
					}

					attributes += "}"

					if (replacedAttributes.size === 0) continue

					// remove the replaced attributes from the code
					for (const attribute of replacedAttributes) {
						code.remove(attribute.start, attribute.end)
					}

					// add a new spread attribute at the end of the element
					const newSpreadAttributeString = `{...(${i(
						"handle_attributes"
					)}(${attributes}, "${attribute_name}",  ${uneval(lang_attribute_name)}))}`

					code.appendRight(element.start + element.name.length + 1, " " + newSpreadAttributeString)
				}

				for (const element of svelteElements) {
					const thisAttribute = element.tag

					//every svelte:element should have a this attribute -> if not, something is wrong
					if (!thisAttribute) continue

					const attribute = element.attributes.find(
						(attr) => attr.type === "Attribute" && attr.name === attribute_name
					)

					if (!attribute) continue

					const langAttribute = lang_attribute_name
						? element.attributes.find(
								(attr) => attr.type === "Attribute" && attr.name === lang_attribute_name
						  )
						: undefined

					const thisAttributeValue =
						typeof thisAttribute === "string"
							? uneval(thisAttribute)
							: "`${" + originalCode.slice(thisAttribute.start, thisAttribute.end) + "}`"

					const newLangAttribute = `
					${attribute_name}={

							${thisAttributeValue} === ${uneval(element_name)} ?

							${i("translateHref")}(
								${attrubuteValuesToJSValue(attribute.value, originalCode)},
								${langAttribute ? attrubuteValuesToJSValue(langAttribute.value, originalCode) : "undefined"}
							)

							: 
							${attrubuteValuesToJSValue(attribute.value, originalCode)}

					}
					`

					//replace the attribute with the new attribute
					code.overwrite(attribute.start, attribute.end, newLangAttribute)
				}
			}

			const before: string[] = []
			const after: string[] = []

			before.push(`import { getContext as ${i("getContext")} } from 'svelte';`)

			after.push(
				dedent`
					const ${i("context")} = ${i("getContext")}('${PARAGLIDE_CONTEXT_KEY}');
				
					function ${i("translateHref")}(href, hreflang) {
						if(!${i("context")}) return href;
						return ${i("context")}.translateHref(href, hreflang);
					}

					/**
					 * @param {Record<string, any>} attrs
					 * @param {string} attribute_name
					 * @param {string | undefined} lang_attribute_name
					 */
					function ${i("handle_attributes")}(attrs, attribute_name, lang_attribute_name) {
						//If the element has the data-no-translate attribute, don't translate it
						if(attrs["data-no-translate"] === true) return attrs;


						if(attribute_name in attrs) {
							const attr = attrs[attribute_name];
							const hreflang = lang_attribute_name ? attrs[lang_attribute_name] : undefined;
							attrs[attribute_name] = ${i("translateHref")}(attr, hreflang);
						}

						return attrs;
					}
                        `
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