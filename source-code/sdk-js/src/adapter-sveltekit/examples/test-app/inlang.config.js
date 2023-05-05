/**
 * @type { import("@inlang/core/config").DefineConfig }
 */
export async function defineConfig(env) {
	const { default: jsonPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@2/dist/index.js",
	)
	const { default: sdkPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/npm/@inlang/sdk-js@0.0.4/dist/plugin/index.js",
	)
	const { default: ideExtensionPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/npm/@inlang/ide-extension-plugin@0.0.2/dist/index.js",
	)

	return {
		referenceLanguage: "en",
		plugins: [
			jsonPlugin({ pathPattern: "./languages/{language}.json" }),
			sdkPlugin({
				languageNegotiation: {
					strategies: [{ type: "localStorage" }, { type: "navigator" }],
				},
			}),
			/* TODO: Remove after showcase */
			ideExtensionPlugin({
				messageReferenceMatchers: async (/** @type {{ "documentText": string; }} */ args) => {
					const regex = /(?<!\w){?t\(['"](?<messageId>\S+)['"]\)}?/gm
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
				extractMessageOptions: [
					{
						callback: (messageId) => `{i("${messageId}")}`,
					},
				],
			}),
		],
	}
}
