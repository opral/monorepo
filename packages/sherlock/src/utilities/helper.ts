import { selectBundleNested, type IdeExtensionConfig } from "@inlang/sdk"
import { safeState } from "./state.js"
import { logger } from "./logger.js"

export const getExtensionApi = async (): Promise<IdeExtensionConfig | undefined> =>
	(
		await (safeState()?.project?.plugins.get() ?? Promise.resolve([]))
	).find((plugin) => plugin?.meta?.["app.inlang.ideExtension"])
		?.meta?.["app.inlang.ideExtension"] as IdeExtensionConfig | undefined

/**
 *
 * @deprecated
 * Not needed anymore but left in to reduce refactoring https://github.com/opral/monorepo/pull/3137
 */
export const getSelectedBundleByBundleIdOrAlias = async (bundleIdOrAlias: string) => {
	const activeProject = safeState()?.project
	if (!activeProject) {
		logger.warn("getSelectedBundleByBundleIdOrAlias called without an active project")
		return undefined
	}
	return await selectBundleNested(activeProject.db)
		.where("bundle.id", "=", bundleIdOrAlias)
		.executeTakeFirst()
}
