import type { InlangInstance } from '@inlang/app';

export const updateSdkPluginVersion = async (inlang: InlangInstance) => {
	// const inlangConfigAsString = await readFile(inlangConfigFilePath, { encoding: "utf-8" })

	// // this regex detects the new `https://cdn.jsdelivr.net/npm/@inlang/sdk-js-plugin/dist/index.js` as well as
	// // the older https://cdn.jsdelivr.net/npm/@inlang/sdk-js/dist/plugin/index.js url
	// // both urls are also detected with the optional @version identifier
	// const REGEX_PLUGIN_VERSION =
	// 	/https:\/\/cdn\.jsdelivr\.net\/npm\/@inlang\/sdk-js(-plugin)?@?(.*)?\/dist(\/plugin)?\/index\.js/g

	// const newConfig = inlangConfigAsString.replace(
	// 	REGEX_PLUGIN_VERSION,
	// 	`https://cdn.jsdelivr.net/npm/@inlang/sdk-js-plugin@${version}/dist/index.js`,
	// )

	// if (inlangConfigAsString !== newConfig) {
	// 	console.info(
	// 		`Updating 'inlang.config.json' to use the correct version of '@inlang/sdk-js-plugin' (${version})`,
	// 	)

	// 	await writeFile(inlangConfigFilePath, newConfig)
	// }
}