import sdkPlugin from "@inlang/sdk-js/plugin"

/**
 * @type { import("@inlang/core/config").DefineConfig }
 */
export async function defineConfig(env) {
	// const { default: sdkPlugin } = await env.$import(
	// 	"https://cdn.jsdelivr.net/npm/@inlang/sdk-js@0.0.4/dist/plugin/index.js",
	// )

	return {
		referenceLanguage: "en",
		plugins: [
			sdkPlugin({
				// @ts-ignore
				debug: true,
				languageNegotiation: {
					strategies: [{ type: "url" }],
				},
			}),
		],
	}
}
