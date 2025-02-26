import { commands } from "vscode"
import { capture } from "../services/telemetry/index.js"
import { settingsPanel } from "../utilities/settings/settingsView.js"
import type { ProjectViewNode } from "../utilities/project/project.js"

export const openSettingsViewCommand = {
	command: "sherlock.openSettingsView",
	title: "Sherlock: Open Settings View",
	register: commands.registerCommand,
	callback: async function (node: ProjectViewNode) {
		await settingsPanel({ context: node.context })

		capture({
			event: "IDE-EXTENSION Settings View opened",
		})
		return undefined
	},
}
