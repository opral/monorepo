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
	.action(initCommandAction)

/**
 * The action for the init command.
 *
 * Exported for testing purposes. Should not be used directly.
 *
 */
export async function initCommandAction() {
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

	const [configFile, error] = await rpc.generateConfigFile({
		fs: fs,
		resolveFrom: process.cwd(),
		applicationId: "CLI",
	})
	clearInterval(interval)
	if (error && error.type === "Exception") {
		rpcSpinner.fail(dedent`
The CLI couldn't generate the config file automatically. 

This is a not a bug, but a limitation of the AI algorithm the CLI uses. 
Please create the config file manually by following the instructions 
at https://inlang.com/documentation. 

${error.message ? "Error message: " + error.message : ""}
`)
		return
	} else if (error) {
		rpcSpinner.fail(dedent`
An internal bug occured while generating the config file.

Please report this bug at https://github.com/inlang/inlang/issues

${error.message ? "Error message: " + error.message : ""}`)
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
}

async function configAlreadyExists() {
	try {
		await fs.readFile("./inlang.config.js")
		return true
	} catch (error) {
		return false
	}
}
