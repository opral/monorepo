import { Command } from "commander"
import { log } from "../../utilities/log.js"
import type { NodeishFilesystem } from "@lix-js/fs"
import fs from "node:fs/promises"
import { tryAutoGenProjectSettings } from "@inlang/create-project"

export const init = new Command()
	.command("init")
	.description("Initialize a new inlang project.")
	.action(async () => {
		await initCommandAction({ logger: log, nodeishFs: fs })
	})

export async function initCommandAction(args: {
	nodeishFs: NodeishFilesystem
	filepath?: string
	logger: any
}) {
	const inlangConfigFilePath = "./project.inlang.json"

	try {
		const newProjFileStat = await fs.stat(inlangConfigFilePath)
		if (newProjFileStat) {
			args.logger.error("Aborting project intialization: Found existing inlang configuration.")
		}

		return
	} catch (error: any) {
		if (error.code !== "ENOENT") {
			args.logger.error("unknown read error: " + error)
			return
		}
	}

	const settings = await tryAutoGenProjectSettings({
		nodeishFs: args.nodeishFs,
		basePath: process.cwd(),
	})

	if (settings === undefined) {
		// the site inlang.com/new doesn't exist yet but putting it here
		// to not forget to add it later
		args.logger.info(
			"Could not auto generate project settings. Go to https://inlang.com/new to create a project."
		)
		return
	}

	args.logger.success(`Successfully created your inlang project at: ${inlangConfigFilePath}`)
}
