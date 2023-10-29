import { test, expect } from "vitest"
import { PluginSettings } from "./settings.js"
import { Value } from "@sinclair/typebox/value"

test("it should be possible to use an absolute path", () => {
	const settings = {
		filePath: "/home/messages.json",
	} as any
	expect(Value.Check(PluginSettings, settings)).toBe(true)
})

test("it should be possible to use a relative path", () => {
	const settings = {
		filePath: "/home/messages.json",
	} as any
	expect(Value.Check(PluginSettings, settings)).toBe(true)
})

test("it should be possible to use parent directories in the storage path", () => {
	const settings = {
		filePath: "../messages.json",
	} as any
	expect(Value.Check(PluginSettings, settings)).toBe(true)
})
