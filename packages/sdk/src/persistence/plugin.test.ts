import { test, expect } from "vitest"
import { createMessage, createNodeishMemoryFs } from "../test-utilities/index.js"
import { normalizeMessage } from "../storage/helper.js"
import { pluginId } from "./plugin.js"

const mockMessages = [
	createMessage("first_message", {
		en: "If this fails I will be sad",
	}),
	createMessage("second_message", {
		en: "Let's see if this works",
		de: "Mal sehen ob das funktioniert",
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
	const persistedMessages = JSON.stringify(mockMessages.map(normalizeMessage), undefined, 2)

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
