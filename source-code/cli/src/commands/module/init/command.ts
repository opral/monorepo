import { Command } from "commander"
import prompts from "prompts"
import { log } from "../../../utilities/log.js"
import fs from "node:fs/promises"
import nodepath from "node:path"
import { getTemplate } from "./template.js"

const typeOptions = ["lintRule", "plugin"] as const

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
			await execute({ fs, type })
			log.success(`Successfully initialized a new ${type} module.`)
			log.info(`Don't forget to run 'npm install' to install the dependencies.`)
		} catch (e) {
			log.error(e)
		}
	})

export async function execute(args: { fs: typeof fs; type: ModuleInitOptions["type"] }) {
	const filesInDir = await args.fs.readdir("./")
	if (filesInDir.length !== 0) {
		log.error(
			"The current working directory is not empty. Please run this command in an empty directory.",
		)
		return
	}
	const files = getTemplate(args)
	for (const path in files) {
		// create the directory if not exists
		await args.fs.mkdir(nodepath.parse(path).dir, { recursive: true })
		await args.fs.writeFile(path, files[path as keyof typeof files], { encoding: "utf-8" })
	}
}
