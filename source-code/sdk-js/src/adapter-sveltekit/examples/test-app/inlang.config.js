/**
 * @type { import("@inlang/core/config").DefineConfig }
 */
export async function defineConfig(env) {
	const { default: jsonPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-json@3/dist/index.js",
	)
	const { default: sdkPlugin } = await env.$import("../../../../../sdk-js-plugin/dist/index.js")

	return {
		referenceLanguage: "en",
		plugins: [
			jsonPlugin({
				pathPattern: "./languages/{language}.json",
			}),
			sdkPlugin({
				debug: true,
				languageNegotiation: {
					strategies: [{ type: "url" }],
				},
				routing: {
					exclude: ['/api'],
				}
			}),
		],
	}
}
