import { rpc } from "@inlang/rpc"
import { toV1Message, fromV1Message } from "../shim.js"

/**
 * @type {import("../types/plugin.js").Plugin2}
 */
const translatorPlugin = {
	id: "plugin.inlangdev.machineTranslate",
	displayName: "Machine Translate",
	description: "Provides a machine-translator to lint-rules",

	addCustomApi({ settings }) {
		console.info("addCustomApi")
		return {
			"app.machineTranslate": {
				/**
				 * @param {any} param0
				 * @returns
				 */
				translate: async ({ messageBundle, sourceLanguageTag, targetLanguageTags }) => {
					const asMessage = toV1Message(messageBundle)
					console.info(
						`Machine translating ${
							messageBundle.id
						} from ${sourceLanguageTag} into ${targetLanguageTags}. The available languages are ${settings.locales.join(
							", "
						)}`
					)
					const translationResult = await rpc.machineTranslateMessage({
						message: asMessage,
						sourceLanguageTag,
						targetLanguageTags,
					})

					console.log("translationResult", translationResult)

					if (translationResult.error || !translationResult.data)
						throw new Error(translationResult.error)

					const translatedBundle = fromV1Message(translationResult.data)
					return translatedBundle
				},
			},
		}
	},
}

export default translatorPlugin
