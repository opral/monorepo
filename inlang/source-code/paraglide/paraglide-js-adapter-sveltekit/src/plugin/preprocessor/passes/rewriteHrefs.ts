import { PARAGLIDE_CONTEXT_KEY } from "../../../constants.js"
import type { PreprocessingPass } from "../index.js"
import { getElementsFromAst } from "../utils/ast.js"
import { attrubuteValuesToJSValue } from "../utils/attributes-to-values.js"
import { identifier } from "../utils/identifier.js"
import dedent from "dedent"

const i = identifier("rewriteHrefs")

export const RewriteHrefs: PreprocessingPass = {
	condition: ({ content }) => {
		return content.includes("href")
	},
	apply: ({ ast, code, originalCode }) => {
		const links = getElementsFromAst(ast, "a")

		let rewroteHref = false

		//Replace all links with the new links
		for (const link of links) {
			//If the link has no href attribute there is nothing to do
			const hrefAttribute = link.attributes.find((attribute) => attribute.name === "href")
			if (!hrefAttribute) continue

			const optOutAttribute = link.attributes.find(
				(attribute) => attribute.name === "data-no-translate"
			)
			if (optOutAttribute) continue

			//Turn the href attribute contents into a template string
			const hrefAsTemplateString = attrubuteValuesToJSValue(hrefAttribute.value, originalCode)

			//If the link has a hreflang attribute, use it as the language tag
			const hreflang = link.attributes.find((attribute) => attribute.name === "hreflang")
			const hreflangValue = hreflang
				? attrubuteValuesToJSValue(hreflang.value, originalCode)
				: `undefined`

			//Replace the href attribute with the new href attribute
			const newHrefAttributeString = `href={${i(
				"translateHref"
			)}(${hrefAsTemplateString}, ${hreflangValue})}`
			code.overwrite(hrefAttribute.start, hrefAttribute.end, newHrefAttributeString)

			rewroteHref = true
		}

		if (!rewroteHref) {
			return {}
		}

		return {
			scriptAdditions: {
				before: [`import { getContext as ${i("getContext")} } from 'svelte';`],

				after: [
					dedent`
						const ${i("context")} = ${i("getContext")}('${PARAGLIDE_CONTEXT_KEY}');

						function ${i("translateHref")}(href, hreflang) {
							if(!${i("context")}) return href;
							return ${i("context")}.translateHref(href, hreflang);
						}
					`,
				],
			},
		}
	},
}
