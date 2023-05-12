import { Command } from "commander"
import fs from "node:fs/promises"
import { rpc } from "@inlang/rpc"
import prompts from "prompts"
import { log } from "../../utilities.js"
import ora from "ora"
import { dedent } from "ts-dedent"

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
		}, 12000)

		const [configFile, exception] = await rpc.generateConfigFile({
			fs: fs,
			resolveFrom: new URL("./", import.meta.url).pathname,
		})
		clearInterval(interval)
		if (exception) {
			rpcSpinner.fail(dedent`
The program couldn't generate the config file automatically. 

This is a not a bug, but a limitation of the AI. Please create the config file manually 
by following the instructions at https://inlang.com/documentation. 

${exception.errorMessage ? "Error message: " + exception.errorMessage : ""}
`)
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
