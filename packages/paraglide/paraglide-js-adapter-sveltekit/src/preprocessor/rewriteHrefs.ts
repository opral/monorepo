import {
	LANGUAGE_TAG_ALIAS,
	OUTDIR_ALIAS,
	TRANSLATE_PATH_FUNCTION_NAME,
	TRANSLATE_PATH_MODULE_ID,
} from "../constants.js"
import type { PreprocessingPass } from "./index.js"
import type { Ast, AttributeValue, LinkElement, TemplateNode } from "./types.js"

export const RewriteHrefs: PreprocessingPass = {
	condition: ({ content }) => {
		return content.includes("href")
	},
	apply: ({ ast, code, originalCode }) => {
		const links = getLinkElements(ast)

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
				`import { ${TRANSLATE_PATH_FUNCTION_NAME} } from '${TRANSLATE_PATH_MODULE_ID}';`,
				`import { languageTag as ${LANGUAGE_TAG_ALIAS} } from '${OUTDIR_ALIAS}/runtime.js';`,
			],
		}
	},
}

function getLinkElements(ast: Ast): LinkElement[] {
	let links: LinkElement[] = []
	function walk(templateNode: TemplateNode) {
		if (templateNode.type === "Element" && templateNode.name === "a") {
			links.push(templateNode as LinkElement)
		}

		templateNode.children?.forEach(walk)
	}
	walk(ast.html)
	return links
}

function attrubuteValuesToJSValue(values: AttributeValue[], originalCode: string): string {
	let templateString = "`"

	for (const value of values) {
		switch (value.type) {
			case "Text":
				templateString += escapeStringLiteral(value.data)
				break
			case "MustacheTag": {
				const expressionCode = originalCode.slice(value.expression.start, value.expression.end)
				templateString += "${"
				templateString += expressionCode
				templateString += "}"
				break
			}
		}
	}

	templateString += "`"
	return templateString
}

function escapeStringLiteral(string: string) {
	return string.replace(/`/g, "\\`").replace(/\$/g, "\\$")
}
