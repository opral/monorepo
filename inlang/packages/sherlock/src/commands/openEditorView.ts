import { commands } from "vscode"
import { telemetry } from "../services/telemetry/index.js"
import { editorView } from "../utilities/editor/editorView.js"
import * as vscode from "vscode"

export const openEditorViewCommand = {
	command: "sherlock.openEditorView",
	title: "Sherlock: Open Editor View",
	register: commands.registerCommand,
	callback: async function (args: { bundleId: string; context: vscode.ExtensionContext }) {
		await editorView({ bundleId: args.bundleId, context: args.context })

		telemetry.capture({
			event: "IDE-EXTENSION Editor View opened",
			properties: { bundleId: args.bundleId },
		})
		return undefined
	},
}
