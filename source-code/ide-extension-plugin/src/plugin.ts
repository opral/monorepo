import { type IdeExtensionSettings, validateIdeExtensionSettings } from "./schema.js"
import { createPlugin } from "@inlang/core/plugin"

// ------------------------------------------------------------------------------------------------

export const ideExtensionPlugin = createPlugin<IdeExtensionSettings>(({ settings }) => ({
	id: "inlang.ide-extension",
	config: async () => {
		// set fallback if no settings are provided
		const fallback = {
			messageReferenceMatchers: [
				//@ts-ignore
				async (/** @type {{ "documentText": string; }} */ args) => {
					const regex = /(?<!\w){?i\(['"](?<messageId>\S+)['"]\)}?/gm
					const str = args.documentText
					let match
					const result = []

					while ((match = regex.exec(str)) !== null) {
						const startLine = (str.slice(0, Math.max(0, match.index)).match(/\n/g) || []).length + 1
						const startPos = match.index - str.lastIndexOf("\n", match.index - 1)
						const endPos =
							match.index +
							match[0].length -
							str.lastIndexOf("\n", match.index + match[0].length - 1)
						const endLine =
							(str.slice(0, Math.max(0, match.index + match[0].length)).match(/\n/g) || []).length +
							1

						if (match.groups && "messageId" in match.groups) {
							result.push({
								messageId: match.groups["messageId"],
								position: {
									start: {
										line: startLine,
										character: startPos,
									},
									end: {
										line: endLine,
										character: endPos,
									},
								},
							})
						}
					}
					return result
				},
			],
			extractMessageOptions: [
				{
					callback: (messageId: string) => `{i("${messageId}")}`,
				},
				{
					callback: (messageId: string) => `i("${messageId}")`,
				},
			],
			documentSelectors: [
				{ language: "javascript" },
				{ language: "javascriptreact" },
				{ language: "typescript" },
				{ language: "typescriptreact" },
				{ language: "svelte" },
				{ language: "vue" },
				{ language: "html" },
			],
		}

		// check if settings are already set & if not set them to default
		const updatedSettings = {
			messageReferenceMatchers:
				settings?.messageReferenceMatchers || fallback.messageReferenceMatchers,
			extractMessageOptions: settings?.extractMessageOptions || fallback.extractMessageOptions,
			documentSelectors: settings?.documentSelectors || fallback.documentSelectors,
		}

		const parsedConfig = validateIdeExtensionSettings(updatedSettings)

		return {
			ideExtension: parsedConfig,
		}
	},
}))
