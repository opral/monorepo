/**
 * @type {import("@inlang/core/config").DefineConfig}
 */
export async function defineConfig(env) {
	const { default: plugin } = await env.$import("./dist/index.js")

	return {
		referenceLanguage: "en",
		plugins: [
			plugin({
				pathPattern: "./examples/example04/{language}.json",
				variableReferencePattern: ["{", "}"],
				format: {
					nested: true,
				},
			}),
		],
	}
}
