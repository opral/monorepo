import {
	LANGUAGE_TAG_ALIAS,
	PARAGLIDE_RUNTIME_MODULE_ALIAS,
	TRANSLATE_PATH_FUNCTION_NAME,
	TRANSLATE_PATH_MODULE_ID,
} from "../../../constants.js"
import type { PreprocessingPass } from "../index.js"
import { getElementsFromAst } from "../utils/ast.js"
import { attrubuteValuesToJSValue } from "../utils/attributes-to-values.js"

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
			const langValue = hreflang
				? attrubuteValuesToJSValue(hreflang.value, originalCode)
				: `${LANGUAGE_TAG_ALIAS}()`

			//Replace the href attribute with the new href attribute
			const newHrefAttributeString = `href={${TRANSLATE_PATH_FUNCTION_NAME}(${hrefAsTemplateString}, ${langValue})}`
			code.overwrite(hrefAttribute.start, hrefAttribute.end, newHrefAttributeString)

			rewroteHref = true
		}

		if (!rewroteHref) {
			return { imports: [] }
		}

		return {
			imports: [
				`import ${TRANSLATE_PATH_FUNCTION_NAME} from '${TRANSLATE_PATH_MODULE_ID}';`,
				`import { languageTag as ${LANGUAGE_TAG_ALIAS} } from '${PARAGLIDE_RUNTIME_MODULE_ALIAS}';`,
			],
		}
	},
}
