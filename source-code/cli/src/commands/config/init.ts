import { Command } from "commander"
import fs from "node:fs"
import path from "node:path"
import prompts from "prompts"
import { log } from "../../utilities.js"
import { italic } from "../../utilities/format.js"
import { nodeFileSystem } from "../../utilities/fs/env/node.js"
import { getConfigContent } from "../../utilities/getConfigContent.js"
import { getLanguageFolderPath } from "../../utilities/getLanguageFolderPath.js"
import { getSupportedLibrary, SupportedLibrary } from "../../utilities/getSupportedLibrary.js"
import { validateCommandAction } from "./validate.js"

export const init = new Command()
	.command("init")
	.description("Initialize the inlang.config.js file.")
	.action(initCommandAction)

/**
 * The action for the init command.
 *
 * Exported for testing purposes. Should not be used directly.
 *
 */

export async function initCommandAction() {
	// Check if config file already exists
	const packageJsonPath = "./package.json"
	const inlangConfigPath = "./inlang.config.js"
	const rootDir = "./"

	if (fs.existsSync(inlangConfigPath)) {
		log.error("⏸️  Config file already exists.")
		const answer = await prompts({
			type: "confirm",
			name: "overwrite",
			message: "Do you want to overwrite the existing config file?",
			initial: false,
		})
		if (answer.overwrite === false) {
			log.info("Aborting.")
			return
		}
	}

	// Check if the user wants to continue with the WIP version
	const answerWip = await prompts({
		type: "confirm",
		name: "wip",
		message:
			"The auto generation is work in progress and might not work as expected. Do you want to continue?",
		initial: true,
	})
	if (answerWip.wip === false) {
		return
	}

	// check if package.json exists
	let plugin: SupportedLibrary = "json"
	if (fs.existsSync(packageJsonPath)) {
		// Check if popular internationalization libraries are dependencies
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
		plugin = getSupportedLibrary({ packageJson })

		// Plugin specific logs
		if (plugin === "@inlang/sdk-js") {
			log.warn(
				"📦 Using plugin: @inlang/sdk-js. You have to add a plugin which reads and writes resources e.g. the inlang-plugin-json. See: https://inlang.com/documentation/plugins/registry",
			)
		}
	} else {
		log.warn("📦 No package.json found in this directory. Using fallback plugin: json")
		// Fallback, remove this someday
		plugin = "json"
	}

	// Generate the config file content
	const languageFolderPath = await getLanguageFolderPath({ fs: nodeFileSystem, rootDir })
	const pathPatternRaw = languageFolderPath ? path.join(languageFolderPath, "{language}.json") : ""

	// Windows: Replace backward slashes with forward slashes
	const pathPattern = pathPatternRaw.replace(/\\/g, "/")

	if (pathPattern === "") {
		log.warn(
			"Could not find a language folder in the project. You have to enter the path to your language files (pathPattern) manually.",
		)
	} else {
		log.info(`🗂️  Found language folder path: ${italic(pathPattern)}`)
		log.info(
			`🗂️  Please adjust the ${`pathPattern`} in the inlang.config.js manually if it is not parsed correctly.`,
		)
	}

	const configContent = await getConfigContent({ plugin, pathPattern })

	// Write the config file
	fs.writeFileSync(inlangConfigPath, configContent)

	log.success(`🎉 inlang.config.js file created successfully.`)

	// validate the config file
	validateCommandAction()
}
