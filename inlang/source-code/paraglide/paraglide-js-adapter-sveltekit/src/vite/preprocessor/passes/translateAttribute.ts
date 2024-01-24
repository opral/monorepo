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
			return content.includes(attribute_name) || content.includes("{...")
		},

		apply: ({ ast, code, originalCode }) => {
			const i = identifier(`translate_attribute_pass_${element_name}_${attribute_name}`)

			const links = getElementsFromAst(ast, element_name)

			let rewroteAttribute = false
			let rewroteSpread = false

			const before: string[] = []
			const after: string[] = []

			//Replace all links with the new links
			for (const link of links) {
				//If the link has no href attribute there is nothing to do
				const attribute = link.attributes.find(
					(attribute): attribute is Attribute<string> =>
						attribute.type === "Attribute" && attribute.name === attribute_name
				)
				if (!attribute) continue

				const optOutAttribute = link.attributes.find(
					(attribute): attribute is Attribute<string> =>
						attribute.type === "Attribute" && attribute.name === "data-no-translate"
				)
				if (optOutAttribute) continue

				//Turn the href attribute contents into a template string
				const attributeAsTemplateString = attrubuteValuesToJSValue(attribute.value, originalCode)

				//If the link has a hreflang attribute, use it as the language tag
				const langAttribute = lang_attribute_name
					? link.attributes.find((attribute) => attribute.name === lang_attribute_name)
					: undefined
				const langAttributeValue = langAttribute
					? attrubuteValuesToJSValue(langAttribute.value, originalCode)
					: `undefined`

				//Replace the href attribute with the new href attribute
				const newAttributeString = `${attribute_name}={${i(
					"translateHref"
				)}(${attributeAsTemplateString}, ${langAttributeValue})}`
				code.overwrite(attribute.start, attribute.end, newAttributeString)

				rewroteAttribute = true
			}

			//Loop over all Spread attributes
			for (let link_index = 0; link_index < links.length; link_index++) {
				const link = links[link_index]
				if (!link) continue

				const spreadAttributes = link.attributes.filter(
					(attribute): attribute is SpreadAttribute => attribute.type === "Spread"
				)

				//Wrap the spread attributes in a function call
				for (const spreadAttribute of spreadAttributes) {
					//Get the value of the spread attribute, without the spread operator - Already a JS expression
					const value = code.slice(spreadAttribute.start + 4, spreadAttribute.end - 1)

					const newSpreadAttributeString = `{...${i("handle_spread")}(${value})}`
					code.overwrite(spreadAttribute.start, spreadAttribute.end, newSpreadAttributeString)

					rewroteSpread = true
				}
			}

			if (rewroteAttribute || rewroteSpread) {
				before.push(`import { getContext as ${i("getContext")} } from 'svelte';`)

				after.push(
					dedent`
                            const ${i("context")} = ${i("getContext")}('${PARAGLIDE_CONTEXT_KEY}');
    
                            function ${i("translateHref")}(href, hreflang) {
                                if(!${i("context")}) return href;
                                return ${i("context")}.translateHref(href, hreflang);
                            }

							function ${i("handle_spread")}(props) {
								if(!${i("context")}) 
									return props;
								
								if("href" in props) {
									props.href = ${i("translateHref")}(props.href, props.hreflang);
								}

								return props;
							}
                        `
				)
			}

			return {
				scriptAdditions: {
					before,
					after,
				},
			}
		},
	}
}
