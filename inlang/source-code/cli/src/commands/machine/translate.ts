/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Command } from "commander"
import { rpc } from "@inlang/rpc"
import { getInlangProject } from "../../utilities/getInlangProject.js"
import { log } from "../../utilities/log.js"
import type { InlangProject } from "@inlang/sdk"
import prompts from "prompts"

export const translate = new Command()
	.command("translate")
	.requiredOption("--project <path>", "Path to the project settings file.", "./project.inlang.json")
	.option("-f, --force", "Force machine translation and skip the confirmation prompt.", false)
	.description("Machine translate all resources.")
	.action(async (args: { force: boolean; project: string }) => {
		try {
			// Prompt the user to confirm
			if (!args.force) {
				log.warn(
					"Human translations are better than machine translations. \n\nWe advise to use machine translations in the build step without commiting them to the repo. By using machine translate in the build step, you avoid missing translations in production while still flagging to human translators that transaltions are missing. You can use the force flag (-f, --force) to skip this prompt warning."
				)
				const response = await prompts({
					type: "confirm",
					name: "value",
					message: "Are you sure you want to machine translate?",
				})
				if (!response.value) {
					log.warn("Aborting machine translation.")
					return
				}
			}

			const project = await getInlangProject({ projectPath: args.project })

			translateCommandAction({ project })
		} catch (error) {
			log.error(error)
		}
	})

export async function translateCommandAction(args: { project: InlangProject }) {
	try {
		const projectConfig = args.project.settings()

		if (!projectConfig) {
			log.error(`No inlang config found, please add a project.inlang.json file`)
			return
		}

		const sourceLanguageTag = projectConfig.sourceLanguageTag
		// Get languages to translate to with the reference language removed

		const languagesTagsToTranslateTo = projectConfig.languageTags.filter(
			// @ts-ignore - type mismtach - fix after refactor
			(tag) => tag !== sourceLanguageTag
		)

		log.info(`📝 Translating to ${languagesTagsToTranslateTo.length} languages.`)

		// parallelize in the future
		for (const id of args.project.query.messages.includedMessageIds()) {
			const { data: translatedMessage, error } = await rpc.machineTranslateMessage({
				message: args.project.query.messages.get({ where: { id } })!,
				sourceLanguageTag: sourceLanguageTag,
				targetLanguageTags: languagesTagsToTranslateTo,
			})
			if (error) {
				log.error(`Couldn't translate message "${id}": ${error}`)
				continue
			}

			args.project.query.messages.update({ where: { id: id }, data: translatedMessage! })
			log.info(`Machine translated message "${id}"`)
		}
		// Log the message counts
		log.success("Machine translate complete.")
	} catch (error) {
		log.error(error)
	}
}
