/**
 * @type { import("@inlang/core/config").DefineConfig }
 */
export async function defineConfig(env) {
	const { default: jsonPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@2/dist/index.js"
	)
	const { default: sdkPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/npm/@inlang/sdk-js@0.0.4/dist/plugin/index.js"
	)

	return {
		referenceLanguage: "en",
		plugins: [
			jsonPlugin({ pathPattern: "./languages/{language}.json" }),
			sdkPlugin({
				languageNegotiation: {
					strategies: [{ type: "localStorage" }, { type: "navigator" }]
				}
			}),
		],
	}
}
