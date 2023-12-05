import {
	LANGUAGE_TAG_ALIAS,
	PARAGLIDE_RUNTIME_MODULE_ALIAS,
	TRANSLATE_PATH_FUNCTION_NAME,
	TRANSLATE_PATH_MODULE_ID,
} from "../../../constants.js"
import type { PreprocessingPass } from "../index.js"
import { getElementsFromAst } from "../utils/ast.js"
import { attrubuteValuesToJSValue } from "../utils/attributes-to-values.js"

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

			const langValue = `${LANGUAGE_TAG_ALIAS}()`
			const actionAttributeAsTemplateString = attrubuteValuesToJSValue(
				formactionAttributes.value,
				originalCode
			)

			//Replace the formaction attribute with the new formaction attribute
			const newFormactionAttributeString = `formaction={${TRANSLATE_PATH_FUNCTION_NAME}(${actionAttributeAsTemplateString}, ${langValue})}`
			code.overwrite(
				formactionAttributes.start,
				formactionAttributes.end,
				newFormactionAttributeString
			)

			rewroteFormActions = true
		}

		if (!rewroteFormActions) {
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
