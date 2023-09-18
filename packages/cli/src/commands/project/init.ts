import { Command } from "commander"
import { log } from "../../utilities/log.js"
import type { NodeishFilesystem } from "@lix-js/fs"
import fs from "node:fs/promises"
import { tryAutoGenProjectSettings } from "@inlang/create-project"
import { ProjectSettings } from "@inlang/project-settings"
import path from "node:path"

export const init = new Command()
	.command("init")
	.description(
		"Initialize a new inlang project at project.inlang.json with optional module configuration.",
	)
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

	try {
		const oldProjFileStat = await fs.stat("./inlang.config.js")
		if (oldProjFileStat) {
			args.logger.error(
				"Found an existing inlang configuration in the legacy format, please run the migration command instead.",
			)
		}

		return
	} catch (error: any) {
		if (error.code !== "ENOENT") {
			args.logger.error("unknown read error: " + error)
			return
		}
	}

	const { warnings, errors } = await tryAutoGenProjectSettings({
		nodeishFs: args.nodeishFs,
		pathJoin: path.join,
	})

	if (!errors?.length) {
		for (const warning of warnings) args.logger.warn(warning)
	} else {
		const settings: ProjectSettings = {
			$schema: "https://inlang.com/schema/project-settings",
			sourceLanguageTag: "en",
			languageTags: ["en"],
			modules: [],
		}

		const configString = JSON.stringify(settings, undefined, 4)
		await args.nodeishFs.writeFile(inlangConfigFilePath, configString + "\n")

		args.logger.warn(
			`Could not auto generate a project configuration, falling back to a minimal base configuration. Please manually setup your inlang project.`,
		)
	}

	args.logger.info(`✅ Successfully created your inlang configuration at: ${inlangConfigFilePath}`)
}
