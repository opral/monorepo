import { Command } from "commander"
import { getInlangProject } from "../../utilities/getInlangProject.js"
import { type InlangProject, stringifyMessage } from "@inlang/sdk"
import { log } from "../../utilities/log.js"
import { projectOption } from "../../utilities/globalFlags.js"
import fs from "fs-extra"
import type { Message } from "@inlang/sdk"

export const validate = new Command()
	.command("validate")
	.description("Validate the inlang project settings file.")
	.requiredOption(projectOption.flags, projectOption.description)
	.option("-s, --save", "force a save of the messages", false)
	.option("-d, --dumpFile <dumpFile>", 'File to dump JSON messages into. e.g. "dump.json"')
	.action(validateCommandAction)

export async function validateCommandAction(args: { project: string }) {
	try {
		log.info("🔎 Validating the inlang project...")
		// if `getInlangProject` doesn't throw, the project is valid
		const project = await getInlangProject({ projectPath: args.project })
		const options = validate.opts()
		if (options.save) {
			const id = "$$$-test-message-$$$"
			if (
				project.query.messages.create({ data: testMessage(id, project) }) &&
				project.query.messages.delete({ where: { id } })
			) {
				log.success(`Created and deleted test message with id: ${id}`)
			} else {
				log.error(`Failed to create test message with id: ${id}`)
			}
		}
		if (options.dumpFile) {
			await fs.writeFile(
				options.dumpFile,
				`[\n${project.query.messages.getAll().map(stringifyMessage).join(",\n")}\n]`
			)
			log.success(`Dumped messages JSON to ${options.dumpFile}`)
		}
		log.success("The project is valid!")
	} catch (error) {
		log.error(error)
	}
}

function testMessage(id: string, project: InlangProject) {
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
