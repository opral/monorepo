import { Command } from "commander"
import { rpc } from "@inlang/rpc"
import { getInlangProject } from "../../utilities/getInlangProject.js"
import { log } from "../../utilities/log.js"
import type { InlangProject } from "@inlang/app"

export const translate = new Command()
	.command("translate")
	.option("-f, --force", "Force machine translation and skip the confirmation prompt.")
	.description("Machine translate all resources.")
	.action(async () => {
		// Get the options
		const options = translate.opts()

		try {
			// Prompt the user to confirm
			if (!options.force) {
				const promptly = await import("promptly")
				log.warn(
					"Machine translations are not very accurate. We advise you to only use machine translations in a build step to have them in production but not commit them to your repository. You can use the force flag (-f, --force) to skip this prompt in a build step.",
				)
				const answer = await promptly.prompt("Are you sure you want to machine translate? (y/n)")
				if (answer !== "y") {
					log.info("🚫 Aborting machine translation.")
					return
				}
			}

			// Get the config
			const { data: inlang, error } = await getInlangProject()

			if (error) {
				log.error(error)
				// no message because that's handled in getInlangProject
				return
			}

			translateCommandAction({ inlang })
		} catch (error) {
			log.error(error)
		}
	})

export async function translateCommandAction(args: { inlang: InlangProject }) {
	try {
		const sourceLanguageTag = args.inlang.config().sourceLanguageTag
		// Get languages to translate to with the reference language removed

		const languagesTagsToTranslateTo = args.inlang
			.config()
			.languageTags.filter((tag) => tag !== sourceLanguageTag)

		log.info(`📝 Translating to ${languagesTagsToTranslateTo.length} languages.`)

		// parallelize in the future
		for (const id of args.inlang.query.messages.includedMessageIds()) {
			const { data: translatedMessage, error } = await rpc.machineTranslateMessage({
				message: args.inlang.query.messages.get({ where: { id } })!,
				sourceLanguageTag: sourceLanguageTag,
				targetLanguageTags: languagesTagsToTranslateTo,
			})
			if (error) {
				log.error(`❌ Couldn't translate message "${id}": ${error}`)
				continue
			}

			args.inlang.query.messages.update({ where: { id: id }, data: translatedMessage! })
			log.info(`✅ Machine translated message "${id}"`)
		}
		// Log the message counts
		log.info("Machine translate complete.")
	} catch (error) {
		log.error(error)
	}
}
