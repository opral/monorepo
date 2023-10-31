/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { test, expect } from "vitest"
import { createMessage, createNodeishMemoryFs } from "@inlang/sdk/test-utilities"
import { vi } from "vitest"
import { beforeEach } from "node:test"
import { pluginId } from "./plugin.js"
import type { PluginSettings } from "./settings.js"
import { StorageSchema } from "./storageSchema.js"
import { Value } from "@sinclair/typebox/value"

beforeEach(() => {
	// clear plugin state between tests
	vi.resetModules()
})

// the test ensures:
//   - messages can be loaded
//   - messages can be saved
//   - after loading and saving messages, the state is the same as before (roundtrip)
test("roundtrip (saving/loading messages)", async () => {
	const { plugin } = await import("./plugin.js")
	const fs = createNodeishMemoryFs()

	const settings = {
		[pluginId]: { filePath: "./messages.json" } satisfies PluginSettings,
	} as any

	const m1 = createMessage("first-message", {
		en: "If this fails I will be sad",
	})

	const m2 = createMessage("second-message", {
		en: "Let's see if this works",
		de: "Mal sehen ob das funktioniert",
	})

	const initialFile = JSON.stringify({
		$schema: "https://inlang.com/schema/inlang-message-format",
		data: [m1, m2],
	} satisfies StorageSchema)

	await fs.writeFile("./messages.json", initialFile)

	const firstMessageLoad = await plugin.loadMessages!({
		settings,
		nodeishFs: fs,
	})

	expect(firstMessageLoad).toStrictEqual([m1, m2])

	await plugin.saveMessages!({
		settings,
		nodeishFs: fs,
		messages: firstMessageLoad,
	})

	const fileAfterRoundtrip = await fs.readFile("./messages.json", { encoding: "utf-8" })

	expect(fileAfterRoundtrip).toStrictEqual(initialFile)
	expect(Value.Check(StorageSchema, JSON.parse(fileAfterRoundtrip))).toBe(true)

	const messagesAfterRoundtrip = await plugin.loadMessages!({
		settings,
		nodeishFs: fs,
	})

	expect(messagesAfterRoundtrip).toStrictEqual(firstMessageLoad)
})

test("keep the json formatting to decrease git diff's and merge conflicts", async () => {
	const { plugin } = await import("./plugin.js")
	const fs = createNodeishMemoryFs()

	const settings = {
		[pluginId]: { filePath: "./messages.json" } satisfies PluginSettings,
	} as any

	const m1 = createMessage("hello-world", {
		en: "hello",
	})

	// double tab indentation
	const initialFile = JSON.stringify(
		{
			$schema: "https://inlang.com/schema/inlang-message-format",
			data: [m1],
		} satisfies StorageSchema,
		undefined,
		2
	)

	await fs.writeFile("./messages.json", initialFile)

	const messages = await plugin.loadMessages!({
		settings,
		nodeishFs: fs,
	})

	await plugin.saveMessages!({
		settings,
		nodeishFs: fs,
		messages,
	})

	const fileAfterRoundtrip = await fs.readFile("./messages.json", { encoding: "utf-8" })

	// the file should still tab indentation
	expect(fileAfterRoundtrip).toStrictEqual(initialFile)
	expect(Value.Check(StorageSchema, JSON.parse(fileAfterRoundtrip))).toBe(true)
})

test("save the messages alphabetically to decrease git diff's and merge conflicts", async () => {
	const { plugin } = await import("./plugin.js")

	const fs = createNodeishMemoryFs()

	const settings = {
		[pluginId]: { filePath: "./messages.json" } satisfies PluginSettings,
	} as any

	const messages = [
		createMessage("c", { en: "c" }),
		createMessage("a", { en: "a" }),
		createMessage("b", { en: "b" }),
	]

	await plugin.saveMessages!({
		settings,
		nodeishFs: fs,
		messages,
	})

	const fileAfterSave = await fs.readFile("./messages.json", { encoding: "utf-8" })
	const json = JSON.parse(fileAfterSave) as StorageSchema
	expect(Value.Check(StorageSchema, json)).toBe(true)
	expect(json.data[0]?.id).toBe("a")
	expect(json.data[1]?.id).toBe("b")
	expect(json.data[2]?.id).toBe("c")
})

test("don't throw if the storage path does not exist. instead, create the file and/or folder (enables project initialization usage)", async () => {
	for (const path of [
		"./messages.json",
		"./folder/messages.json",
		"./folder/folder/messages.json",
	]) {
		const { plugin } = await import("./plugin.js")
		const fs = createNodeishMemoryFs()

		const messages = await plugin.loadMessages!({
			settings: {
				[pluginId]: { filePath: path } satisfies PluginSettings,
			} as any,
			nodeishFs: fs,
		})

		const createdFile = await fs.readFile(path, { encoding: "utf-8" })
		const parsedFile = JSON.parse(createdFile)
		// messages should be empty but no error should be thrown
		expect(messages).toStrictEqual([])
		expect(Value.Check(StorageSchema, parsedFile)).toBe(true)
	}
})

test("recursively creating a directory should not fail if a subpath already exists", async () => {
	const { plugin } = await import("./plugin.js")
	const fs = createNodeishMemoryFs()
	// folder-a exists but folder-b doesn't
	const path = "./folder-a/folder-b/messages.json"

	await fs.mkdir("./folder-a/")
	await fs.writeFile("./folder-a/placeholder.txt", "hi")

	const messages = await plugin.loadMessages!({
		settings: {
			[pluginId]: { filePath: path } satisfies PluginSettings,
		} as any,
		nodeishFs: fs,
	})

	const createdFile = await fs.readFile(path, { encoding: "utf-8" })
	const parsedFile = JSON.parse(createdFile)
	// messages should be empty but no error should be thrown
	expect(messages).toStrictEqual([])
	expect(Value.Check(StorageSchema, parsedFile)).toBe(true)
})

// adds typesafety in IDEs
test("it should add the $schema property to the file if it does not exist", async () => {
	const { plugin } = await import("./plugin.js")

	const fs = createNodeishMemoryFs()

	const settings = {
		[pluginId]: { filePath: "./messages.json" } satisfies PluginSettings,
	} as any

	await plugin.saveMessages!({
		settings,
		nodeishFs: fs,
		messages: [],
	})

	const fileAfterSave = await fs.readFile("./messages.json", { encoding: "utf-8" })
	const json = JSON.parse(fileAfterSave) as StorageSchema
	expect(json.$schema).toBe("https://inlang.com/schema/inlang-message-format")
	expect(json.data).toStrictEqual([])
	expect(Value.Check(StorageSchema, json)).toBe(true)
})
