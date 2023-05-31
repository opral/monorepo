import { createInlangFunction } from "./inlang-function.js"
import { test, describe, expect } from "vitest"
import { createMessage, createResource } from "@inlang/core/test"

const resource = createResource(
	"en",
	createMessage("hello", "world"),
	createMessage("welcome", [
		{ type: "Text", value: "Welcome, " },
		{
			type: "Placeholder",
			body: {
				type: "VariableReference",
				name: "name",
			},
		},
		{ type: "Text", value: "!" },
	]),
)

describe("createInlangFunction", () => {
	test("it should resolve the message", () => {
		const fn = createInlangFunction(resource)

		const result = fn("hello")

		expect(result).toBe("world")
	})

	test("it should resolve the message with placeholder", () => {
		const fn = createInlangFunction(resource)

		const result = fn("welcome", { name: "Inlang" })

		expect(result).toBe("Welcome, Inlang!")
	})

	test("it should return an empty string for a placeholder if placeholder does not get passed as args", () => {
		const fn = createInlangFunction(resource)

		const result = fn("welcome", {})

		expect(result).toBe("Welcome, !")
	})

	test("it should not fail if placeholders get passed as args", () => {
		const fn = createInlangFunction(resource)

		const result = fn("welcome")

		expect(result).toBe("Welcome, !")
	})

	test("it should return an empty string if key does not exist in resource", () => {
		const fn = createInlangFunction(resource)

		const result = fn("missing-key")

		expect(result).toBe("")
	})
})
