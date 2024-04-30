import * as vscode from "vscode"
import { updateSetting } from "../utilities/settings/index.js"

export const toggleInlineAnnotationsCommand = {
	command: "sherlock.toggleInlineAnnotations",
	title: "Sherlock: Toggle Inline Annotations",
	register: vscode.commands.registerCommand,
	callback: async () => {
		const currentSetting = vscode.workspace
			.getConfiguration()
			.get<boolean>("sherlock.inlineAnnotations.enabled", true)
		const toggleOption = await vscode.window.showQuickPick(
			[
				{
					label: "Enable",
					description: "Annotations will be visible in the editor.",
					picked: currentSetting,
				},
				{
					label: "Disable",
					description: "Annotations will not be displayed.",
					picked: !currentSetting,
				},
			],
			{
				placeHolder: "Select an option to toggle inline annotations",
				canPickMany: false,
			}
		)

		if (!toggleOption) {
			return
		}

		const newSetting = toggleOption.label.startsWith("Enable")
		await updateSetting("inlineAnnotations.enabled", newSetting)
	},
}
