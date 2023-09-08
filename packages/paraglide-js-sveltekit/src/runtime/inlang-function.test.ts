import { createInlangFunction } from "./inlang-function.js"
import { test, describe, expect } from "vitest"
import { createMessage } from "@inlang/sdk/test-utilities"
const messages = [
	createMessage("hello", { en: "world" }),
	createMessage("welcome", {
		en: [
			{ type: "Text", value: "Welcome, " },
			{
				type: "VariableReference",
				name: "name",
			},
			{ type: "Text", value: "!" },
		],
	}),
]

describe("createInlangFunction", () => {
	test("it should resolve the message", () => {
		const fn = createInlangFunction(messages, "en")

		const result = fn("hello")

		expect(result).toBe("world")
	})

	test("it should resolve the message with placeholder", () => {
		const fn = createInlangFunction(messages, "en")

		const result = fn("welcome", { name: "Inlang" })

		expect(result).toBe("Welcome, Inlang!")
	})

	test("it should return an empty string for a placeholder if placeholder does not get passed as args", () => {
		const fn = createInlangFunction(messages, "en")

		const result = fn("welcome", {})

		expect(result).toBe("Welcome, !")
	})

	test("it should not fail if no placeholders get passed as args", () => {
		const fn = createInlangFunction(messages, "en")

		const result = fn("welcome")

		expect(result).toBe("Welcome, !")
	})

	test("it should return an empty string if key does not exist in message", () => {
		const fn = createInlangFunction(messages, "en")

		const result = fn("missing-key")

		expect(result).toBe("")
	})

	test("it should return an empty string if language does not exist in message", () => {
		const fn = createInlangFunction([createMessage("key", { de: "Hi" })], "en")

		const result = fn("key")

		expect(result).toBe("")
	})

	test("it should return an empty string if pattern does not exist in message", () => {
		const fn = createInlangFunction([createMessage("key", { en: [] })], "en")

		const result = fn("key")

		expect(result).toBe("")
	})
})
