import { Command } from "commander"
import fs from "node:fs/promises"
import { rpc } from "@inlang/rpc"
import prompts from "prompts"
import { log } from "../../utilities.js"
import ora from "ora"

export const init = new Command()
	.command("init")
	.description("Initialize the inlang.config.js file.")
	.action(async () => {
		// ----------- CHECK IF CONFIG FILE ALREADY EXISTS --------------
		if (await configAlreadyExists()) {
			log.error("Config file already exists.")
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
		// ----------------- GENERATE CONFIG FILE -----------------
		// roughly every 9 one iteration is complete
		let assumedIteration = 1
		const rpcSpinner = ora(
			`Generating config file with AI 🤖 ... Iteration ${assumedIteration}/3`,
		).start()
		const interval = setInterval(() => {
			assumedIteration += 1
			rpcSpinner.text = `Generating config file with AI 🤖 ... Iteration ${assumedIteration}/3`
		}, 9000)
		const [configFile, exception] = await rpc.generateConfigFile({
			// @ts-expect-error fs is not a valid type for the filesystem but works
			fs,
			path: "./",
		})
		clearInterval(interval)
		if (exception) {
			rpcSpinner.fail("Failed to generate config file.\n" + exception.errorMessage)
			return
		}
		rpcSpinner.succeed("Generated config file.")
		// ----------------- WRITE CONFIG FILE TO DISK -----------------
		const writeFileSpinner = ora("Writing config file to disk 📝 ...").start()
		try {
			await fs.writeFile("./inlang.config.js", configFile, "utf-8")
			writeFileSpinner.succeed("Wrote config file to disk.")
		} catch (error) {
			writeFileSpinner.fail("Failed to write config file to disk.\n" + (error as any)?.message)
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
