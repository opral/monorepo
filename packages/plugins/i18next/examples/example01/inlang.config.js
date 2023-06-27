/**
 * @type {import("@inlang/core/config").DefineConfig}
 */
export async function defineConfig(env) {
	const { default: plugin } = await env.$import("./dist/index.js")

	return {
		referenceLanguage: "en",
		plugins: [
			plugin({
				pathPattern: "./examples/example01/{language}.json",
				variableReferencePattern: ["{", "}"],
				ignore: [".file.json"],
				format: {
					nested: true,
				},
			}),
		],
	}
}
