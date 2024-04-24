import { Command } from "commander"
import { getInlangProject } from "../../utilities/getInlangProject.js"
import { type InlangProject, normalizeMessage } from "@inlang/sdk"
import { log } from "../../utilities/log.js"
import { projectOption } from "../../utilities/globalFlags.js"
import fs from "fs-extra"
import { resolve } from "node:path"
import type { Message } from "@inlang/sdk"

export let validate = new Command()
	.command("validate")
	.description("Validate the inlang project settings file.")
	.requiredOption(projectOption.flags, projectOption.description)

if (process.env.INLANG_CLI_EXPERIMENTAL) {
	validate = validate
		.option("-s, --save", "Force saveMessages by creating and deleting a temporary message", false)
		.option("-d, --dumpFile <dumpFile>", 'Dump messages into a JSON file. e.g. "messages.json"')
}
validate = validate.action(validateCommandAction)

export async function validateCommandAction(args: { project: string }) {
	try {
		log.info("🔎 Validating the inlang project...")
		// if `getInlangProject` doesn't throw, the project is valid
		const project = await getInlangProject({ projectPath: args.project })
		log.success(`Opened project at ${resolve(process.cwd(), args.project)}`)
		const options = validate.opts()
		if (options.save) {
			const id = "$$$-temporary-message-$$$"
			if (
				project.query.messages.create({ data: tempMessage(id, project) }) &&
				project.query.messages.delete({ where: { id } })
			) {
				log.success(`Created and deleted test message with id: ${id}`)
			} else {
				log.error(`Failed to create test message with id: ${id}`)
			}
		}
		if (options.dumpFile) {
			const dumpFile = resolve(process.cwd(), options.dumpFile)
			await fs.writeFile(
				dumpFile,
				JSON.stringify(project.query.messages.getAll().map(normalizeMessage), undefined, 2)
			)
			log.success(`Dumped messages JSON to ${dumpFile}`)
		}
		log.success("The project is valid!")
	} catch (error) {
		log.error(error)
	}
}

function tempMessage(id: string, project: InlangProject) {
	return {
		id,
		alias: {},
		selectors: [],
		variants: [
			{
				languageTag: project.settings()?.sourceLanguageTag ?? "en",
				match: [],
				pattern: [
					{
						type: "Text",
						value: id,
					},
				],
			},
		],
	} as Message
}
