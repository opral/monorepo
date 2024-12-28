import * as vscode from "vscode"
import type { ErrorNode } from "../utilities/errors/errors.js"
import { msg } from "../utilities/messages/msg.js"

export const copyErrorCommand = {
	command: "sherlock.copyError",
	title: "Sherlock: Copy error",
	register: vscode.commands.registerCommand,
	callback: async (error: ErrorNode) => {
		vscode.env.clipboard.writeText(`${error.label}: ${error.tooltip}`)
		msg("$(check) Copied", "info", "statusBar")
	},
}
