import { Command } from "commander"
import fs from "node:fs/promises"
import { logger, prompt } from "../../api.js"
import { rpc } from "@inlang/rpc"

export const init = new Command()
	.command("init")
	.description("Initialize the inlang.config.js file.")
	.action(async () => {
		// ----------- CHECK IF CONFIG FILE ALREADY EXISTS --------------
		if (await configAlreadyExists()) {
			logger.error("Config file already exists.")
			const answer = await prompt({
				type: "confirm",
				name: "overwrite",
				message: "Do you want to overwrite the existing config file?",
				initial: false,
			})
			if (answer.overwrite === false) {
				logger.info("Aborting.")
				return
			}
		}
		// ----------------- GENERATE CONFIG FILE -----------------
		logger.info("Generating config file with AI 🤖 ...")
		const [configFile, exception] = await rpc.generateConfigFile({
			// @ts-expect-error fs is not a valid type for the filesystem but works
			fs,
			path: "./",
		})
		if (exception) {
			logger.error("Failed to generate config file.", exception.errorMessage)
			return
		}
		logger.success("Generated config file.")
		// ----------------- WRITE CONFIG FILE TO DISK -----------------
		logger.info("Writing config file to disk...")
		try {
			await fs.writeFile("./inlang.config.js", configFile, "utf-8")
			logger.success("Wrote config file to disk.")
		} catch (error) {
			logger.error("Failed to write config file to disk.")
		}
	})

async function configAlreadyExists() {
	try {
		await fs.readFile("./inlang.config.js")
		return true
	} catch (error) {
		return false
	}
}
