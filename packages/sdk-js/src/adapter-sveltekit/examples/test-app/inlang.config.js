import { default as sdkPlugin } from "@inlang/sdk-js/plugin"

/**
 * @type { import("@inlang/core/config").DefineConfig }
 */
export async function defineConfig(env) {
	const { default: jsonPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@2/dist/index.js"
	)
	// TODO: replace once published
	// const { default: sdkPlugin } = await env.$import(
	// 	"https://cdn.jsdelivr.net/npm/@inlang/sdk-js/dist/plugin/index.js"
	// )

	return {
		referenceLanguage: "en",
		plugins: [
			jsonPlugin({ pathPattern: "./{language}.json" }),
			sdkPlugin({
				languageNegotiation: {
					strategies: [{ type: "localStorage" }, { type: "navigator" }]
				}
			}),
		],
	}
}
