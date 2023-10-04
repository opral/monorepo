import { Command } from "commander"
import prompts from "prompts"
import { log } from "../../../utilities/log.js"
import fs from "fs-extra"
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"

const typeOptions = ["messageLintRule", "plugin"] as const

export type ModuleInitOptions = {
	type: (typeof typeOptions)[number]
}

export const init = new Command()
	.command("init")
	.description("Initialize a new inlang module codebase.")
	.option(`--type <type>", "The type of the module which can be (${typeOptions.join(" | ")})`)
	.action(async (options: ModuleInitOptions) => {
		let type = options.type
		if (options.type === undefined) {
			const response = await prompts({
				type: "select",
				name: "value",
				message: "What type of module do you want to create?",
				choices: typeOptions.map((type) => ({ title: type, value: type })),
			})
			if (!response.value) {
				return
			}
			type = response.value
		}
		try {
			log.log(`📦 Initializing a new ${type} module.`)
			await execute({ type })
			log.success(`Successfully initialized a new ${type} module.`)
			log.info(`Don't forget to run 'npm install' to install the dependencies.`)
		} catch (e) {
			log.error(e)
		}
	})

export async function execute(args: { type: ModuleInitOptions["type"] }) {
	const filesInDir = fs.readdirSync("./")

	if (filesInDir.length !== 0) {
		log.error(
			"The current working directory is not empty. Please run this command in an empty directory."
		)
		return
	}

	// the dist output directory
	const dist = dirname(fileURLToPath(import.meta.url))

	switch (args.type) {
		case "messageLintRule":
			return fs.copySync(`${dist}/templates/message-lint-rule`, "./")
		case "plugin":
			return fs.copySync(`${dist}/templates/plugin`, "./")
		default:
			throw new Error(`Unknown module type: ${args.type}`)
	}
}
