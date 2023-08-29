/**
 * @type { import("@inlang/core/config").DefineConfig }
 */
export async function defineConfig(env) {
	const { default: i18nextPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js",
	)

	const { default: standardLintRules } = await env.$import(
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-standard-lint-rules@3/dist/index.js",
	)

	return {
		sourceLanguageTag: "en",
		plugins: [
			i18nextPlugin({
				pathPattern: {
					"client-page": "app/i18n/locales/{language}/client-page.json",
					footer: "app/i18n/locales/{language}/footer.json",
					"second-page": "app/i18n/locales/{language}/second-page.json",
					translation: "app/i18n/locales/{language}/translation.json",
				},
			}),
			standardLintRules(),
		],
	}
}
