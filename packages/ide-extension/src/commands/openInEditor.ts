import { Uri, commands, env } from "vscode"
import { telemetry } from "../services/telemetry/implementation.js"
import type { Message } from "@inlang/sdk"
import { CONFIGURATION } from "../configuration.js"
import { getGitOrigin } from "../utilities/settings/getGitOrigin.js"

export const openInEditorCommand = {
	command: "inlang.openInEditor",
	title: "Inlang: Open in Editor",
	register: commands.registerCommand,
	callback: async function (args: { messageId: Message["id"]; selectedProjectPath: string }) {
		// TODO: Probably the origin should be configurable via the config.
		const origin = (await getGitOrigin())?.replaceAll(".git", "")
		const uri = args.messageId
			? `${CONFIGURATION.STRINGS.EDITOR_BASE_URL}${origin}?project=${encodeURIComponent(
					args.selectedProjectPath
			  )}&id=${encodeURIComponent(args.messageId)}`
			: `${CONFIGURATION.STRINGS.EDITOR_BASE_URL}${origin}`

		env.openExternal(Uri.parse(uri))

		telemetry.capture({
			event: "IDE-EXTENSION Editor opened via tooltip",
		})
		return undefined
	},
}
