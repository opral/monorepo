import { Command } from "commander"
import { generateConfigFile } from "@inlang/shared/openai"
import fs from "node:fs/promises"
import { logger } from "../../api.js"

export const init = new Command()
	.command("init")
	.description("Initialize the inlang.config.js file.")
	.action(async () => {
		logger.info("Generating config file with AI 🤖 ...")
		// @ts-ignore
		const result = await generateConfigFile({ fs, path: "./" })
		if (result.isErr) {
			logger.error("Failed to generate config file.", result.error)
			return
		}
		logger.success("Generated config file.")
		logger.info("Writing config file to disk...")
		try {
			await fs.writeFile("./inlang.config.js", result.value, "utf-8")
			logger.success("Wrote config file to disk.")
		} catch (error) {
			logger.error("Failed to write config file to disk.", error)
		}
	})
