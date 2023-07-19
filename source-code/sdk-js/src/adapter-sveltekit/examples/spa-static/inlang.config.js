/**
 * @type { import("@inlang/core/config").DefineConfig }
 */
export async function defineConfig(env) {
	const { default: jsonPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@2/dist/index.js",
	)

	return {
		sourceLanguageTag: "en",
		plugins: [
			jsonPlugin({
				pathPattern: "./languageTags/{languageTag}.json",
			}),
		],
	}
}
