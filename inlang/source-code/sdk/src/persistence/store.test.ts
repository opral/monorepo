import { test, expect } from "vitest"
import { createNodeishMemoryFs } from "../test-utilities/index.js"
import type { MessageBundle } from "../v2/types.js"
import {
	createMessageBundle,
	createMessage,
	normalizeMessageBundle,
} from "../v2/createMessageBundle.js"

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
	const { loadAll, saveAll } = await import("./store.js")
	const fs = createNodeishMemoryFs()
	const projectDir = "/test/project.inlang"
	const filePath = projectDir + "/messages.json"
	const persistedMessages = JSON.stringify(mockMessages.map(normalizeMessageBundle), undefined, 2)

	await fs.mkdir(projectDir, { recursive: true })
	await fs.writeFile(filePath, persistedMessages)

	const firstMessageLoad = await loadAll({
		filePath,
		nodeishFs: fs,
	})

	expect(firstMessageLoad).toStrictEqual(mockMessages)

	await saveAll({
		filePath,
		nodeishFs: fs,
		messages: firstMessageLoad,
	})

	const afterRoundtrip = await fs.readFile(filePath, { encoding: "utf-8" })

	expect(afterRoundtrip).toStrictEqual(persistedMessages)

	const messagesAfterRoundtrip = await loadAll({
		filePath,
		nodeishFs: fs,
	})

	expect(messagesAfterRoundtrip).toStrictEqual(firstMessageLoad)
})
