import { test, expect } from "vitest"
import { createNodeishMemoryFs } from "../test-utilities/index.js"
import type { MessageBundle } from "../v2/types.js"
import {
	createMessageBundle,
	createMessage,
	normalizeMessageBundle,
} from "../v2/createMessageBundle.js"
import { pluginId } from "./plugin.js"

const mockMessages: MessageBundle[] = [
	createMessageBundle({
		id: "first_message",
		messages: [
			createMessage({
				locale: "en",
				text: "If this fails I will be sad",
			}),
		],
	}),
	createMessageBundle({
		id: "second_message",
		messages: [
			createMessage({ locale: "en", text: "Let's see if this works" }),
			createMessage({ locale: "de", text: "Mal sehen ob das funktioniert" }),
		],
	}),
]

// the test ensures:
//   - messages can be loaded
//   - messages can be saved
//   - after loading and saving messages, the state is the same as before (roundtrip)
test("roundtrip (saving/loading messages)", async () => {
	const { loadMessages, saveMessages } = await import("./plugin.js")
	const fs = createNodeishMemoryFs()
	const projectDir = "/test/project.inlang"
	const pathPattern = projectDir + "/messages.json"
	const persistedMessages = JSON.stringify(mockMessages.map(normalizeMessageBundle), undefined, 2)

	const settings = {
		sourceLanguageTag: "en",
		languageTags: ["en", "de"],
		modules: [],
		[pluginId]: { pathPattern },
	}

	await fs.mkdir(projectDir, { recursive: true })
	await fs.writeFile(pathPattern, persistedMessages)

	const firstMessageLoad = await loadMessages({
		settings,
		nodeishFs: fs,
	})

	expect(firstMessageLoad).toStrictEqual(mockMessages)

	await saveMessages({
		settings,
		nodeishFs: fs,
		messages: firstMessageLoad,
	})

	const afterRoundtrip = await fs.readFile(pathPattern, { encoding: "utf-8" })

	expect(afterRoundtrip).toStrictEqual(persistedMessages)

	const messagesAfterRoundtrip = await loadMessages({
		settings,
		nodeishFs: fs,
	})

	expect(messagesAfterRoundtrip).toStrictEqual(firstMessageLoad)
})
