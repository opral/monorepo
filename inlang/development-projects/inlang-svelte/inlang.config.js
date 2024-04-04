/**
 * @type { import("@inlang/core/config").DefineConfig }
 */
export async function defineConfig(env) {
	const { default: jsonPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-json@3/dist/index.js",
	)
	const { default: sdkPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-paraglide@latest/dist/index.js",
	)

	return {
		sourceLanguageTag: "en",
		plugins: [
			jsonPlugin({
				pathPattern: "./languages/{language}.json",
			}),
			sdkPlugin({
				languageNegotiation: {
					strategies: [{ type: "url" }],
				},
			}),
		],
	}
}
