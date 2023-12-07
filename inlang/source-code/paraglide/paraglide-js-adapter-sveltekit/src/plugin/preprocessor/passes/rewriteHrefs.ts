import { PARAGLIDE_CONTEXT_KEY } from "../../../constants.js"
import type { PreprocessingPass } from "../index.js"
import { getElementsFromAst } from "../utils/ast.js"
import { attrubuteValuesToJSValue } from "../utils/attributes-to-values.js"
import { identifier as i } from "../utils/identifier.js"
import dedent from "dedent"

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

						// If there is a context, use it to translate the hrefs, 
						// otherwise just return the hrefs as they are
						const ${i("translateHref")} = ${i("context")} 
							? (href, hreflang) => ${i("context")}.translatePath(href, hreflang ?? ${i("context")}.languageTag())
							: (href, hreflang) => href;
					`,
				],
			},
		}
	},
}
