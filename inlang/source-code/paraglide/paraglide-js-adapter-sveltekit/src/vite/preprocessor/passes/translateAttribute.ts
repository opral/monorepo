import { PARAGLIDE_CONTEXT_KEY } from "../../../runtime/constants.js"
import type { PreprocessingPass } from "../index.js"
import type { Attribute, SpreadAttribute } from "../types.js"
import { getElementsFromAst } from "../utils/ast.js"
import { attrubuteValuesToJSValue } from "../utils/attributes-to-values.js"
import { identifier } from "../utils/identifier.js"
import dedent from "dedent"

export function createTranslateAttributePass(
	element_name: string,
	attribute_name: string,
	lang_attribute_name?: string
): PreprocessingPass {
	return {
		condition: ({ content }) => {
			const includesAttribute = content.includes(attribute_name)
			const includesSpread = content.includes("{...")
			const includesElement = content.includes(`<${element_name}`)
			const includesSvelteElement = content.includes("<svelte:element")

			return (includesSpread || includesAttribute) && (includesElement || includesSvelteElement)
		},

		apply: ({ ast, code, originalCode }) => {
			const i = identifier(`translate_attribute_pass_${element_name}_${attribute_name}`)

			const elements = getElementsFromAst(ast, element_name)
			const svelteElements = getElementsFromAst(ast, "svelte:element")

			const before: string[] = []
			const after: string[] = []

			//Replace all links with the new links
			for (const element of elements) {
				let attributes = "{"

				const replacedAttributes = new Set<(typeof element.attributes)[number]>()

				for (const attribute of element.attributes) {
					switch (attribute.type) {
						case "Attribute": {
							const isMainAttribute = attribute.name === attribute_name
							const isLangAttribute = lang_attribute_name && attribute.name === lang_attribute_name
							const isDataNoTranslate = attribute.name === "data-no-translate"
							if (!isMainAttribute && !isLangAttribute && !isDataNoTranslate) continue

							if (isDataNoTranslate) {
								console.log(JSON.stringify(attribute, null, 2))
							}

							attributes += `"${escapeForDoubleQuotes(attribute.name)}": ${attrubuteValuesToJSValue(
								attribute.value,
								originalCode
							)},`
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
				const newSpreadAttributeString = ` {...(${i("handle_attributes")}(${attributes}))}`

				code.appendRight(element.start + element.name.length + 1, newSpreadAttributeString)
			}

			before.push(`import { getContext as ${i("getContext")} } from 'svelte';`)

			after.push(
				dedent`
                            const ${i("context")} = ${i("getContext")}('${PARAGLIDE_CONTEXT_KEY}');
    
                            function ${i("translateHref")}(href, hreflang) {
                                if(!${i("context")}) return href;
                                return ${i("context")}.translateHref(href, hreflang);
                            }

							function ${i("handle_attributes")}(attrs) {

								//If the element has the data-no-translate attribute, don't translate it
								if(attrs["data-no-translate"] === true) return attrs;


								if("href" in attrs) {
									attrs.href = ${i("translateHref")}(attrs.href, attrs.hreflang);
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

const escapeForDoubleQuotes = (str: string) => str.replace(/"/g, '\\"')
