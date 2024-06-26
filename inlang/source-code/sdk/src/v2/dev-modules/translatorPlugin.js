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
				translate: ({ messageBundle, sourceLanguageTag, targetLanguageTags }) => {
					console.info(
						`Machine translating ${
							messageBundle.id
						} from ${sourceLanguageTag} into ${targetLanguageTags}. The available languages are ${settings.locales.join(
							", "
						)}`
					)

					return messageBundle
				},
			},
		}
	},
}

export default translatorPlugin
