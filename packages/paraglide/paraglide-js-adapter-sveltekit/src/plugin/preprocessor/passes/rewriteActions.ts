import { PARAGLIDE_RUNTIME_MODULE_ALIAS, TRANSLATE_PATH_MODULE_ID } from "../../../constants.js"
import type { PreprocessingPass } from "../index.js"
import { getElementsFromAst } from "../utils/ast.js"
import { attrubuteValuesToJSValue } from "../utils/attributes-to-values.js"
import { identifier } from "../utils/identifier.js"

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

			const langValue = `${identifier("languageTag")}()`
			const actionAttributeAsTemplateString = attrubuteValuesToJSValue(
				actionAttribute.value,
				originalCode
			)

			//Replace the action attribute with the new action attribute
			const newActionAttributeString = `action={${identifier(
				"translatePath"
			)}(${actionAttributeAsTemplateString}, ${langValue})}`
			code.overwrite(actionAttribute.start, actionAttribute.end, newActionAttributeString)

			rewroteActions = true
		}

		if (!rewroteActions) {
			return { imports: [] }
		}

		return {
			imports: [
				`import ${identifier("translatePath")} from '${TRANSLATE_PATH_MODULE_ID}';`,
				`import { languageTag as ${identifier(
					"languageTag"
				)} } from '${PARAGLIDE_RUNTIME_MODULE_ALIAS}';`,
			],
		}
	},
}
