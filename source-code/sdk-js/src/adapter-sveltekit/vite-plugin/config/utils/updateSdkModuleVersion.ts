import { openInlangProject, type InlangProject } from "@inlang/app"
import { getNodeishFs } from "./getNodeishFs.js"
import { PATH_TO_INLANG_CONFIG } from "../config.js"
// @ts-ignore
import { version } from "../../../../../package.json"

/**
 * @returns `true` iff the version was updated
 * @returns `false` iff the version is already up2date
 */
export const updateSdkModuleVersion = async (inlang: InlangProject): Promise<boolean> => {
	const config = inlang.config()
	const sdkJSPluginModule = config.modules.find((module) =>
		module.includes("@inlang/sdk-js-plugin"),
	)
	if (!sdkJSPluginModule) return false

	const usedVersion = (sdkJSPluginModule.match(/@inlang\/sdk-js-plugin@(.*)\//) || [])[1]?.split(
		"/",
	)[0]
	if (usedVersion === version) return false

	const newModule = `https://cdn.jsdelivr.net/npm/@inlang/sdk-js-plugin@${version}/dist/index.js`
	inlang.setConfig({
		...config,
		modules: config.modules.map((module) => (module === sdkJSPluginModule ? newModule : module)),
	})

	// TODO: how to actually wait for the config to be written?
	await new Promise((resolve) => setTimeout(resolve, 100))

	return true
}

// TODO: expose this function somewhere
/**
 * Utility function to update the version of the `@inlang/sdk-js-plugin` module in the `inlang.config.json` file.
 * @returns `true` iff the version was updated
 * @returns `false` iff the version is already up2date
 */
export const standaloneUpdateSdkModuleVersion = async () => {
	const inlang = await openInlangProject({
		nodeishFs: await getNodeishFs(),
		configPath: PATH_TO_INLANG_CONFIG,
	})

	return await updateSdkModuleVersion(inlang)
}
