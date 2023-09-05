import { Command } from "commander"
import { log } from "../../utilities/log.js"
import type { NodeishFilesystem } from "@lix-js/fs"
import fs from "node:fs/promises"
import { migrateProjectConfig } from "@inlang/create-project"
import path from "node:path"
import prompts from "prompts"

export const migrate = new Command()
	.command("migrate")
	.description(
		"Migrate a legacy inlang.config.js inlang configuration to the new project.inlang.json.",
	)
	.action(async () => {
		await migrateCommandAction({ logger: log, nodeishFs: fs })
	})

export async function migrateCommandAction(args: {
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

	await prompts({
		type: "confirm",
		name: "autoConfig",
		message:
			"Whe try a best effort migration for your old inlang configuration, this works best if the old file has standard formatting.",
		initial: true,
	})

	const { warnings } = await migrateProjectConfig({
		nodeishFs: args.nodeishFs,
		pathJoin: path.join,
	})

	warnings.forEach((warning) => args.logger.warn(warning))

	args.logger.info(`✅ Successfully created your inlang configuration at: ${inlangConfigFilePath}`)
}
