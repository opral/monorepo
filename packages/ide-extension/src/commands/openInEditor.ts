import { getGitOrigin, telemetry } from "../services/telemetry/implementation.js"
import * as vscode from "vscode"
import type { Message } from "@inlang/sdk"

const EDITOR_BASE_PATH = "https://inlang.com/editor/"

export const openInEditorCommand = {
	id: "inlang.openInEditor",
	title: "Inlang: Open in editor",
	callback: async function (args: { messageId: Message["id"] }) {
		// TODO: Probably the origin should be configurable via the config.
		const origin = (await getGitOrigin())?.replaceAll(".git", "")
		const uri = args.messageId
			? `${EDITOR_BASE_PATH}${origin}?id=${args.messageId}`
			: `${EDITOR_BASE_PATH}${origin}`

		vscode.env.openExternal(vscode.Uri.parse(uri))
		telemetry.capture({
			event: "IDE-EXTENSION Editor opned via tooltip",
		})
		return undefined
	},
}
