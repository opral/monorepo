import { PARAGLIDE_CONTEXT_KEY } from "../../../constants.js"
import type { PreprocessingPass } from "../index.js"
import { getElementsFromAst } from "../utils/ast.js"
import { attrubuteValuesToJSValue } from "../utils/attributes-to-values.js"
import { identifier as i } from "../utils/identifier.js"
import dedent from "dedent"

export const RewriteActions: PreprocessingPass = {
	condition: ({ content }) => {
		return content.includes("action")
	},
	apply: ({ ast, code, originalCode }) => {
		const forms = getElementsFromAst(ast, "form")

		let rewroteActions = false

		//Replace all links with the new links
		for (const form of forms) {
			//If the link has no href attribute there is nothing to do
			const actionAttribute = form.attributes.find((attribute) => attribute.name === "action")
			if (!actionAttribute) continue

			const optOutAttribute = form.attributes.find(
				(attribute) => attribute.name === "data-no-translate"
			)
			if (optOutAttribute) continue

			const actionAttributeAsTemplateString = attrubuteValuesToJSValue(
				actionAttribute.value,
				originalCode
			)

			//Replace the action attribute with the new action attribute
			const newActionAttributeString = `action={${i(
				"translateHref"
			)}(${actionAttributeAsTemplateString}, undefined)}`
			code.overwrite(actionAttribute.start, actionAttribute.end, newActionAttributeString)

			rewroteActions = true
		}

		if (!rewroteActions) {
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
