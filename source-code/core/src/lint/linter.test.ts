import { beforeEach, describe, expect, test, vi } from "vitest"
import { lint } from "./linter.js"
import type { LintRule } from "./rule.js"
import { createMessage } from "../test/utils.js"
import type { Message } from "../ast/schema.js"

vi.spyOn(console, "info").mockImplementation(vi.fn)
vi.spyOn(console, "warn").mockImplementation(vi.fn)
vi.spyOn(console, "error").mockImplementation(vi.fn)

// --------------------------------------------------------------------------------------------------------------------

const doLint = (rules: LintRule[], messages: Message[]) => {
	const config = {
		sourceLanguageTag: "en",
		languageTags: ["en", "de"],
		lint: { rules },
	}
	return lint({ config, messages })
}

const mockMessage = createMessage("first-message", "en", "Welcome to this app.")

// --------------------------------------------------------------------------------------------------------------------

describe("lint", async () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	test("it should be immutable and not modify the messages passed as an argument", async () => {
		const cloned = structuredClone(mockMessage)
		const rule: LintRule = {
			id: "inlang.someError",
			level: "error",
			message: ({ message }) => {
				message.id = "modified"
			},
		}
		await doLint([rule], [cloned])
		expect(cloned).toStrictEqual(mockMessage)
	})

	test("it should not abort the linting process when errors occur", async () => {
		const cloned = structuredClone(mockMessage)

		const rule: LintRule = {
			id: "inlang.someError",
			level: "error",
			message: () => {
				throw new Error("Some error")
			},
		}
		const lints = await doLint([rule], [cloned])
		expect(lints.exceptions!.length).toBe(1)
		expect(lints.exceptions![0]!.message.includes("inlang.someError"))
	})
})
