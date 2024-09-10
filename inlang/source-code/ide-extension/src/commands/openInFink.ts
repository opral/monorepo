import { Uri, commands, env } from "vscode"
import { telemetry } from "../services/telemetry/implementation.js"
import type { Bundle } from "@inlang/sdk2"
// import { CONFIGURATION } from "../configuration.js"

export const openInFinkCommand = {
	command: "sherlock.openInFink",
	title: "Sherlock: Open in Fink",
	register: commands.registerCommand,
	callback: async function (args: { bundleId: Bundle["id"]; selectedProjectPath: string }) {
		console.error("Not implemented", args)

		const uri = "not implemented"
		env.openExternal(Uri.parse(uri))

		telemetry.capture({
			event: "IDE-EXTENSION Editor opened via tooltip",
		})
		return undefined
	},
}
