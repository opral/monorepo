import { Uri, commands, env } from "vscode"
import { getGitOrigin, telemetry } from "../services/telemetry/implementation.js"
import type { Message } from "@inlang/sdk"

// TODO #1844 CLEARIFY Felix - shouldn this point to the fink domain?
const EDITOR_BASE_PATH = "https://inlang.com/editor/"

export const openInEditorCommand = {
	command: "inlang.openInEditor",
	title: "Inlang: Open in Editor",
	register: commands.registerCommand,
	callback: async function (args: { messageId: Message["id"] }) {
		// TODO: Probably the origin should be configurable via the config.
		const origin = (await getGitOrigin())?.replaceAll(".git", "")
		const uri = args.messageId
			? `${EDITOR_BASE_PATH}${origin}?id=${args.messageId}`
			: `${EDITOR_BASE_PATH}${origin}`

		env.openExternal(Uri.parse(uri))
		telemetry.capture({
			event: "IDE-EXTENSION Editor opened via tooltip",
		})
		return undefined
	},
}
