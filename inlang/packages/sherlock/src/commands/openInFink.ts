import { Uri, commands, env } from "vscode"
import type { Bundle } from "@inlang/sdk"
// import { CONFIGURATION } from "../configuration.js"

export const openInFinkCommand = {
	command: "sherlock.openInFink",
	title: "Sherlock: Open in Fink",
	register: commands.registerCommand,
	callback: async function (args: { bundleId: Bundle["id"]; selectedProjectPath: string }) {
		console.error("Not implemented", args)

		const uri = "not implemented"
		env.openExternal(Uri.parse(uri))

		// capture({
		// 	event: "IDE-EXTENSION Editor opened via tooltip",
		// })
		return undefined
	},
}
