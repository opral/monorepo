import { getLatestVersion } from "./getLatestVersion.js"
import type { SupportedLibrary } from "./getSupportedLibrary.js"

// Plugin import types
type PluginImports = {
	[key: string]: string
}

export const getConfigContent = async (args: {
	plugin: SupportedLibrary
	pathPattern: string
}): Promise<string> => {
	const v = getLatestVersion
	const plugin = args.plugin
	const pathPattern = args.pathPattern

	const pluginImports: PluginImports = {
		json: `const { default: jsonPlugin } = await env.$import('https://cdn.jsdelivr.net/npm/@inlang/plugin-json@${await v(
			"@inlang/plugin-json",
		)}/dist/index.js');`,
		i18next: `const { default: i18nextPlugin } = await env.$import('https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@${await v(
			"@inlang/plugin-i18next",
		)}/dist/index.js');`,
		"typesafe-i18n": `const { default: typesafeI18nPlugin } = await env.$import('https://cdn.jsdelivr.net/gh/ivanhofer/inlang-plugin-typesafe-i18n@2/dist/index.js');`,
		"@inlang/sdk-js": `const { default: sdkPlugin } = await env.$import('https://cdn.jsdelivr.net/npm/@inlang/sdk-js-plugin@${await v(
			"@inlang/sdk-js-plugin",
		)}/dist/index.js');`,
	}

	const standardLintRules = `const { default: standardLintRules } = await env.$import('https://cdn.jsdelivr.net/npm/@inlang/plugin-standard-lint-rules@${await v(
		"@inlang/plugin-standard-lint-rules",
	)}/dist/index.js');`

	const pluginImportsCode = pluginImports[plugin] || ""

	const pluginFunctions = [
		plugin === "json" ? `jsonPlugin({ pathPattern: '${pathPattern}' }),` : undefined,
		plugin === "@inlang/sdk-js"
			? `sdkPlugin({languageNegotiation: { strategies: [{ type: "localStorage" }]}}),`
			: undefined,
		plugin === "i18next" ? `i18nextPlugin({ pathPattern: '${pathPattern}' }),` : undefined,
		plugin === "typesafe-i18n" ? `typesafeI18nPlugin(),` : undefined,
	]
		.filter((x) => x !== undefined)
		.join("\n")

	const configContent = `
	/**
 	* @type { import("@inlang/core/config").DefineConfig }
 	*/
	export async function defineConfig(env) {
    ${pluginImportsCode}
    
		${standardLintRules}

    return {
      referenceLanguage: 'en',
      plugins: [
        ${pluginFunctions}
        standardLintRules(),
      ],
    };
  }`

	return configContent
}
