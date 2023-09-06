import { openInlangProject, type InlangProject } from "@inlang/sdk"
import { getNodeishFs } from "./getNodeishFs.js"
import { PATH_TO_INLANG_CONFIG } from "../config.js"
// @ts-ignore
import { version } from "../../../../../package.json"

/**
 * @returns `true` iff the version was updated
 * @returns `false` iff the version is already up2date
 */
export const updateParaglideModuleVersion = async (inlang: InlangProject): Promise<boolean> => {
	const config = inlang.config()!
	console.log("config in updateParaglideModuleVersion", config)

	const paraglidePluginModule = config.modules.find((module) =>
		module.includes("plugin.inlang.paraglideJs"),
	)
	if (!paraglidePluginModule) return false

	const usedVersion = (paraglidePluginModule.match(/@inlang\/plugin-paraglide@(.*)/) ||
		[])[1]?.split("/")[0]
	if (usedVersion === version) return false

	// TODO: check for correct link
	const newModule = `https://cdn.jsdelivr.net/npm/@inlang/paraglide-js/dist/index.js`
	inlang.setConfig({
		...config,
		modules: config.modules.map((module) =>
			module === paraglidePluginModule ? newModule : module,
		),
	})

	// TODO: how to actually wait for the config to be written?
	await new Promise((resolve) => setTimeout(resolve, 100))

	return true
}

/**
 * Utility function to update the version of the `@inlang/plugin-paraglide` module in the `project.inlang.json` file.
 * @returns `true` iff the version was updated
 * @returns `false` iff the version is already up2date
 */
export const standaloneUpdateParaglideModuleVersion = async () => {
	const inlang = await openInlangProject({
		nodeishFs: await getNodeishFs(),
		projectFilePath: PATH_TO_INLANG_CONFIG,
	})

	return await updateParaglideModuleVersion(inlang)
}
