import { Command } from "commander"
import { rpc } from "@inlang/rpc"
import { getInlangProject } from "../../utilities/getInlangProject.js"
import { log } from "../../utilities/log.js"

export const translate = new Command()
	.command("translate")
	.option("-f, --force", "Force machine translation and skip the confirmation prompt.")
	.description("Machine translate all resources.")
	.action(translateCommandAction)

async function translateCommandAction() {
	try {
		// Get the options
		const options = translate.opts()

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

		// Get languages to translate to with the reference language removed
		const languagesTagsToTranslateTo = inlang
			.config()
			.languageTags.filter((tag) => tag !== inlang.config().sourceLanguageTag)

		log.info(`📝 Translating to ${languagesTagsToTranslateTo.length} languages.`)

		// parallelize in the future
		for (const message of Object.values(inlang.query.messages.getAll())) {
			const { data: translatedMessage, error } = await rpc.machineTranslateMessage({
				message,
				sourceLanguageTag: inlang.config().sourceLanguageTag,
				targetLanguageTags: languagesTagsToTranslateTo,
			})
			if (error) {
				log.error(`❌ Couldn't translate message "${message.id}": ${error}`)
				continue
			}
			inlang.query.messages.update({ where: { id: message.id }, data: translatedMessage! })
			log.info(`✅ Machine translated message "${message.id}"`)
		}
		// Log the message counts
		log.info("Machine translate complete.")
	} catch (error) {
		log.error(error)
	}
}
