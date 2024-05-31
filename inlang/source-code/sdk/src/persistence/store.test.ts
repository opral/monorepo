import { test, expect } from "vitest"
import { createNodeishMemoryFs } from "../test-utilities/index.js"
import type { MessageBundle } from "../v2/types.js"
import { createMessageBundle, createMessage, injectJSONNewlines, addSlots } from "../v2/helper.js"
import { openStore, readJSON, writeJSON } from "./store.js"

const locales = ["en", "de"]

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

test("roundtrip readJSON/writeJSON", async () => {
	const nodeishFs = createNodeishMemoryFs()
	const projectPath = "/test/project.inlang"
	const filePath = projectPath + "/messages.json"
	const persistedMessages = injectJSONNewlines(
		JSON.stringify(mockMessages.map((bundle) => addSlots(bundle, locales)))
	)

	await nodeishFs.mkdir(projectPath, { recursive: true })
	await nodeishFs.writeFile(filePath, persistedMessages)

	const firstMessageLoad = await readJSON({
		filePath,
		nodeishFs: nodeishFs,
	})

	expect(firstMessageLoad).toStrictEqual(mockMessages)

	await writeJSON({
		filePath,
		nodeishFs,
		messages: firstMessageLoad,
		locales,
	})

	const afterRoundtrip = await nodeishFs.readFile(filePath, { encoding: "utf-8" })

	expect(afterRoundtrip).toStrictEqual(persistedMessages)

	const messagesAfterRoundtrip = await readJSON({
		filePath,
		nodeishFs,
	})

	expect(messagesAfterRoundtrip).toStrictEqual(firstMessageLoad)
})

test("openStore does minimal CRUD on messageBundles", async () => {
	const nodeishFs = createNodeishMemoryFs()
	const projectPath = "/test/project.inlang"
	const filePath = projectPath + "/messages.json"
	const persistedMessages = JSON.stringify(mockMessages)

	await nodeishFs.mkdir(projectPath, { recursive: true })
	await nodeishFs.writeFile(filePath, persistedMessages)

	const store = await openStore({ projectPath, nodeishFs, locales })

	const messages = await store.messageBundles.getAll()
	expect(messages).toStrictEqual(mockMessages)

	const firstMessageBundle = await store.messageBundles.get({ id: "first_message" })
	expect(firstMessageBundle).toStrictEqual(mockMessages[0])

	const modifedMessageBundle = structuredClone(firstMessageBundle) as MessageBundle
	const newMessage = createMessage({ locale: "de", text: "Wenn dies schiefläuft, bin ich sauer" })
	modifedMessageBundle.messages.push(newMessage)
	await store.messageBundles.set({ data: modifedMessageBundle })

	const setMessageBundle = await store.messageBundles.get({ id: "first_message" })
	expect(setMessageBundle).toStrictEqual(modifedMessageBundle)

	// no need to sleep here
	// with batchedIO, the set should await until the write is done
	const messagesAfterRoundtrip = await readJSON({
		filePath,
		nodeishFs,
	})
	const expected = [setMessageBundle, ...mockMessages.slice(1)]
	expect(messagesAfterRoundtrip).toStrictEqual(expected)

	await store.messageBundles.delete({ id: "first_message" })
	const messagesAfterDelete = await store.messageBundles.getAll()
	expect(messagesAfterDelete).toStrictEqual(mockMessages.slice(1))
})
