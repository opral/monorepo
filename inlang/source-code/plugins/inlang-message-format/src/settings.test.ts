import { test, expect } from "vitest"
import { is } from "valibot"
import { PluginSettings } from "./settings.js"

test("it should not be possible to use an implicit relative path", () => {
	const settings = {
		filePath: "messages.json",
	} as any
	expect(is(PluginSettings, settings)).toBe(false)
})

test("it should be possible to use an absolute path", () => {
	const settings = {
		filePath: "/home/messages.json",
	} as any
	expect(is(PluginSettings, settings)).toBe(true)
})

test("it should be possible to use a relative path", () => {
	const settings = {
		filePath: "/home/messages.json",
	} as any
	expect(is(PluginSettings, settings)).toBe(true)
})

test("it should be possible to use parent directories in the storage path", () => {
	const settings = {
		filePath: "../messages.json",
	} as any
	expect(is(PluginSettings, settings)).toBe(true)
})
