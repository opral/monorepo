import { PARAGLIDE_CONTEXT_KEY } from "../../../constants.js"
import type { PreprocessingPass } from "../index.js"
import { getElementsFromAst } from "../utils/ast.js"
import { attrubuteValuesToJSValue } from "../utils/attributes-to-values.js"
import { identifier } from "../utils/identifier.js"
import dedent from "dedent"

const i = identifier("rewriteFormActions")

export const RewriteFormActions: PreprocessingPass = {
	condition: ({ content }) => {
		return content.includes("formaction")
	},
	apply: ({ ast, code, originalCode }) => {
		const buttons = getElementsFromAst(ast, "button")

		let rewroteFormActions = false

		//Replace all links with the new links
		for (const button of buttons) {
			//If the link has no href attribute there is nothing to do
			const formactionAttributes = button.attributes.find(
				(attribute) => attribute.name === "formaction"
			)
			if (!formactionAttributes) continue

			const optOutAttribute = button.attributes.find(
				(attribute) => attribute.name === "data-no-translate"
			)
			if (optOutAttribute) continue

			const actionAttributeAsTemplateString = attrubuteValuesToJSValue(
				formactionAttributes.value,
				originalCode
			)

			//Replace the formaction attribute with the new formaction attribute
			const newFormactionAttributeString = `formaction={${i(
				"translateHref"
			)}(${actionAttributeAsTemplateString}, undefined)}`
			code.overwrite(
				formactionAttributes.start,
				formactionAttributes.end,
				newFormactionAttributeString
			)

			rewroteFormActions = true
		}

		if (!rewroteFormActions) {
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
