import { shouldRecommend, add } from "@inlang/recommend-ninja"
import type { NodeishFilesystem } from "@lix-js/fs"
import * as vscode from "vscode"
import { getSetting, updateSetting } from "../../settings/index.js"

export const recommendNinja = async (args: { fs: NodeishFilesystem }): Promise<void> => {
	if (
		!(await getSetting("appRecommendations.ninja.enabled").catch(() => true)) ||
		!(await shouldRecommend({ fs: args.fs }))
	) {
		return
	}

	const response = await vscode.window.showInformationMessage(
		"Do you want to add the 🥷 [Ninja Github Action](https://inlang.com/m/3gk8n4n4/app-inlang-ninjaI18nAction) for linting translations in CI?",
		"Yes",
		"Do not ask again"
	)

	if (response === "Yes") {
		await add({ fs: args.fs })
	} else if (response === "Do not ask again") {
		await updateSetting("appRecommendations.ninja.enabled", false)
	}
}
