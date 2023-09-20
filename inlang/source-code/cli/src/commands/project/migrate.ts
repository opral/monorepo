import { Command } from "commander"
import { log } from "../../utilities/log.js"
import type { NodeishFilesystem } from "@lix-js/fs"
import fs from "node:fs/promises"
import { migrateProjectSettings } from "@inlang/create-project"
import path from "node:path"

export const migrate = new Command()
	.command("migrate")
	.description("Migrate a legacy inlang.config.js configuration to the new project.inlang.json.")
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
			args.logger.error(
				"Aborting project intialization: Found existing new inlang configuration at " +
					inlangConfigFilePath,
			)
		}
		return
	} catch (error: any) {
		if (error.code !== "ENOENT") {
			args.logger.error("unknown read error: " + error)
			return
		}
	}

	args.logger.info(`Trying a best effort migration for your old inlang configuration...`)

	const { warnings } = await migrateProjectSettings({
		nodeishFs: args.nodeishFs,
		pathJoin: path.join,
	})

	for (const warning of warnings) args.logger.warn(warning)

	args.logger.info(
		`✅ Successfully created your inlang configuration at: ${inlangConfigFilePath},\nplease double check the result and manually fix what could not be auto-migrated, then delete the old file.`,
	)
}
