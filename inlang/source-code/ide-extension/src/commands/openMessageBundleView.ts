import { commands } from "vscode"
import { telemetry } from "../services/telemetry/implementation.js"
import { messageBundlePanel } from "../utilities/messages/messageBundleView.js"
import vscode from "vscode"
import type { MessageBundle } from "@inlang/sdk/v2"

export const openMessageBundleViewCommand = {
	command: "sherlock.openMessageBundleView",
	title: "Sherlock: Open Message Bundle View",
	register: commands.registerCommand,
	callback: async function (args: { context: vscode.ExtensionContext; id: MessageBundle["id"] }) {
		await messageBundlePanel({ context: args.context, id: args.id })

		telemetry.capture({
			event: "IDE-EXTENSION Message Bundle View opened",
		})
		return undefined
	},
}
