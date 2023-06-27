/**
 * @type {import("@inlang/core/config").DefineConfig}
 */
export async function defineConfig(env) {
	const { default: plugin } = await env.$import("./dist/index.js")

	return {
		referenceLanguage: "en",
		plugins: [
			plugin({
				pathPattern: {
					common: "./examples/example02/{language}/common.json",
					vital: "./examples/example02/{language}/vital.json",
				},
				ignore: [".file.json"],
				format: {
					nested: true,
				},
			}),
		],
	}
}
