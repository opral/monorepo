import { bundleIdOrAliasIs, selectBundleNested, type IdeExtensionConfig } from "@inlang/sdk2"
import { state } from "./state.js"

export const getExtensionApi = async (): Promise<IdeExtensionConfig | undefined> =>
	(await state().project.plugins.get()).find((plugin) => plugin?.meta?.["app.inlang.ideExtension"])
		?.meta?.["app.inlang.ideExtension"] as IdeExtensionConfig | undefined

export const getSelectedBundleByBundleIdOrAlias = async (bundleIdOrAlias: string) => {
	return await selectBundleNested(state().project.db)
		.where(bundleIdOrAliasIs(bundleIdOrAlias))
		.executeTakeFirst()
}
