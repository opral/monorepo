import { query } from "@inlang/core/query"
import { Command } from "commander"
import { countMessagesPerLanguage, getFlag, log } from "../../utilities.js"
import type { Message } from "@inlang/core/ast"
import { rpc } from "@inlang/rpc"
import { getConfig } from "../../utilities/getConfig.js"

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
		const [config, errorMessage] = await getConfig()
		if (!config) {
			log.error(errorMessage)
			// no message because that's handled in getConfig
			return
		}

		// Get all resources
		let resources = await config.readResources({ config })

		// Get reference language from config
		const referenceLanguage = config.referenceLanguage

		// Get reference language resource
		const referenceLanguageResource = resources.find(
			(resource) => resource.languageTag.name === referenceLanguage,
		)!

		// Count messages per language
		const messageCounts = countMessagesPerLanguage(resources)
		log.info(
			"🌏 Found " +
				Object.keys(messageCounts).length +
				" languages with a total of " +
				Object.values(messageCounts).reduce((a, b) => a + b, 0) +
				" messages.",
		)

		// Get languages to translate to with the reference language removed
		const languagesToTranslateTo = resources.filter(
			(resource) => resource.languageTag.name !== referenceLanguage,
		)
		log.info(
			"📝 Translating to " +
				languagesToTranslateTo.length +
				" languages. [" +
				[...new Set(languagesToTranslateTo)]
					.map((language) => language.languageTag.name)
					.join(", ") +
				"]",
		)

		// Translate all messages
		for (const language of languagesToTranslateTo) {
			for (const message of referenceLanguageResource.body) {
				// skip if message already exists in language
				if (language.body.some((langMessage) => langMessage.id.name === message.id.name)) {
					continue
				}

				// 🌏 Translation
				const [translation, exception] = await rpc.machineTranslate({
					referenceLanguage: referenceLanguage,
					targetLanguage: language.languageTag.name,
					text: message.pattern.elements[0]!.value as string,
				})
				if (exception) {
					log.error("Couldn't translate message " + message.id.name + ". ", exception.message)
					continue
				}

				const bold = (text: string) => `\x1b[1m${text}\x1b[0m`
				const italic = (text: string) => `\x1b[3m${text}\x1b[0m`
				log.info(
					getFlag(language.languageTag.name) +
						" Translated message " +
						bold(message.id.name) +
						" to " +
						italic(translation),
				)

				const newMessage: Message = {
					type: "Message",
					id: { type: "Identifier", name: message.id.name },
					pattern: {
						type: "Pattern",
						elements: [{ type: "Text", value: translation }],
					},
				}

				// find language resource to add the new message to
				const languageResource = resources.find(
					(resource) => resource.languageTag.name === language.languageTag.name,
				)
				if (languageResource) {
					const [newResource, exception] = query(languageResource).upsert({
						message: newMessage,
					})

					if (exception) {
						log.error("Couldn't upsert new message. ", exception.message)
					}

					// merge the new resource with the existing resources
					resources = resources.map((resource) => {
						if (resource.languageTag.name === language.languageTag.name && newResource) {
							return newResource
						}
						return resource
					})
				}
			}
		}

		// write the new resource to the file system
		await config.writeResources({
			config,
			resources: resources,
		})

		// Log the message counts
		log.info("✅ Translated all messages.")
	} catch (error) {
		log.error(error)
	}
}
