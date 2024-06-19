import { isAdopted, add } from "@inlang/cross-sell-ninja"
import type { NodeishFilesystem } from "@lix-js/fs"
import * as vscode from "vscode"
import { getSetting, updateSetting } from "../settings/index.js"

export const crossSellNinja = async (args: { fs: NodeishFilesystem }): Promise<void> => {
	if (
		!(await getSetting("appRecommendations.ninja.enabled")) ||
		(await isAdopted({ fs: args.fs }))
	) {
		return
	}

	const response = await vscode.window.showInformationMessage(
		"Do you want to add the 🥷 Ninja Github Action for linting translations in CI?" +
			"\n\n" +
			"https://inlang.com/m/3gk8n4n4/app-inlang-ninjaI18nAction",
		"Yes",
		"Not now"
	)

	if (response === "Yes") {
		await add({ fs: args.fs })
	} else if (response === "Not now") {
		await updateSetting("appRecommendations.ninja.enabled", false)
	}
}
