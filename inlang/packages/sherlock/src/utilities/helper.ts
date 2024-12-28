import { selectBundleNested, type IdeExtensionConfig } from "@inlang/sdk"
import { state } from "./state.js"

export const getExtensionApi = async (): Promise<IdeExtensionConfig | undefined> =>
	(await state().project.plugins.get()).find((plugin) => plugin?.meta?.["app.inlang.ideExtension"])
		?.meta?.["app.inlang.ideExtension"] as IdeExtensionConfig | undefined

/**
 *
 * @deprecated
 * Not needed anymore but left in to reduce refactoring https://github.com/opral/monorepo/pull/3137
 */
export const getSelectedBundleByBundleIdOrAlias = async (bundleIdOrAlias: string) => {
	return await selectBundleNested(state().project.db)
		.where("bundle.id", "=", bundleIdOrAlias)
		.executeTakeFirst()
}
