import { query } from "@inlang/core/query"
import { setupConfig } from "@inlang/core/config"
import { initialize$import, InlangEnvironment } from "@inlang/core/environment"
import fs from "node:fs"
import { Command } from "commander"
import { countMessagesPerLanguage, log } from "../../utilities.js"
import type { Message } from "@inlang/core/ast"
import { rpc } from "@inlang/rpc"

export const translate = new Command()
	.command("translate")
	.description("Machine translate all resources.")
	.action(translateCommandAction)

async function translateCommandAction() {
	// Set up the environment functions
	const env: InlangEnvironment = {
		$import: initialize$import({
			// @ts-ignore TODO: use @inlang-git/fs
			fs: fs.promises,
			fetch,
		}),
		// @ts-ignore TODO: use @inlang-git/fs
		$fs: fs.promises,
	}

	const filePath = process.cwd() + "/inlang.config.js"

	if (!fs.existsSync(filePath)) {
		log.error("No inlang.config.js file found in the repository.")
		return
	} else {
		log.info("✅ Using inlang config file at `" + filePath + "`")
	}

	// Get the content of the inlang.config.js file
	const file = fs.readFileSync(filePath, "utf-8")

	const config = await setupConfig({
		module: await import("data:application/javascript;base64," + btoa(file.toString())),
		env,
	})

	// Get all resources
	const resources = await config.readResources({ config })

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
				.splice(0, 3)
				.map((language) => language.languageTag.name)
				.join(", ") +
			"]",
	)

	// Translate all messages
	for (const message of referenceLanguageResource.body) {
		for (const language of languagesToTranslateTo) {
			// continue if message is already translated
			if (message.pattern.elements[0]!.value !== "") {
				continue
			}

			// TODO: Only for debugging: Remove later
			log.info("🔍 Translating to " + language.languageTag.name + "...")
			// log message id
			log.info(
				"🔍 Translating message " +
					message.id.name +
					" with the message value of " +
					message.pattern.elements[0]!.value +
					" ...",
			)
			console.log(referenceLanguage, language.languageTag.name, message.pattern.elements[0]!.value)
			// TODO

			// 🌏 Translation
			const [translation, exception] = await rpc.machineTranslate({
				telemetryId: "CLI",
				referenceLanguage: referenceLanguage,
				targetLanguage: language.languageTag.name,
				text: message.pattern.elements[0]!.value as string,
			})
			if (exception) {
				log.error("Couldn't translate message " + message.id.name + ". ", exception.message)
				continue
			}

			log.info("🔍 Translated message " + message.id.name + " to " + translation)

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
				const newResources = resources.map((resource) => {
					if (resource.languageTag.name === language.languageTag.name && newResource) {
						return newResource
					}
					return resource
				})

				// write the new resource to the file system
				await config.writeResources({
					config,
					resources: newResources,
				})
			}
		}
	}

	// Log the message counts
	log.info("✅ Translated all messages.")
}
