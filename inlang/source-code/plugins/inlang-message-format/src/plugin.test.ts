/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { test, expect } from "vitest"
import { createMessage, createNodeishMemoryFs } from "@inlang/sdk/test-utilities"
import { vi } from "vitest"
import { beforeEach } from "node:test"
import { pluginId } from "./plugin.js"
import type { PluginSettings } from "./settings.js"

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
		[pluginId]: { storagePath: "./messages.json" } satisfies PluginSettings,
	} as any

	const m1 = createMessage("first-message", {
		en: "If this fails I will be sad",
	})

	const m2 = createMessage("second-message", {
		en: "Let's see if this works",
		de: "Mal sehen ob das funktioniert",
	})

	const initialFile = JSON.stringify([m1, m2])

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
		[pluginId]: { storagePath: "./messages.json" } satisfies PluginSettings,
	} as any

	const m1 = createMessage("hello-world", {
		en: "hello",
	})

	// double tab indentation
	const initialFile = JSON.stringify([m1], undefined, "\t\t")

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

	// the file should still be double tab indented
	expect(fileAfterRoundtrip).toStrictEqual(initialFile)
})

test("sort the messages alphabetically to decrease git diff's and merge conflicts", () => {
	throw new Error("not implemented")
})

test("throw if the storagePath does not start with './' or end with '.json'", () => {
	throw new Error("not implemented")
})

test("throw if the storagePath does not exist", () => {
	throw new Error("not implemented")
})
