import { Uri, commands, env } from "vscode"
import { telemetry } from "../services/telemetry/implementation.js"
import type { Message } from "@inlang/sdk"
import { CONFIGURATION } from "../configuration.js"
import { getGitOrigin } from "../utilities/settings/getGitOrigin.js"
import { getCurrentBranch } from "../utilities/settings/getCurrentBranch.js"

export const openInFinkCommand = {
	command: "sherlock.openInFink",
	title: "Sherlock: Open in Fink",
	register: commands.registerCommand,
	callback: async function (args: { messageId: Message["id"]; selectedProjectPath: string }) {
		const origin = (await getGitOrigin())?.replaceAll(".git", "")
		const branch = (await getCurrentBranch()) || "main"
		const uri = args.messageId
			? `${CONFIGURATION.STRINGS.FINK_BASE_URL}${origin}?project=${encodeURIComponent(
					args.selectedProjectPath
			  )}&branch=${encodeURIComponent(branch)}&id=${encodeURIComponent(args.messageId)}`
			: `${CONFIGURATION.STRINGS.FINK_BASE_URL}${origin}?branch=${encodeURIComponent(branch)}`

		env.openExternal(Uri.parse(uri))

		telemetry.capture({
			event: "IDE-EXTENSION Editor opened via tooltip",
		})
		return undefined
	},
}
