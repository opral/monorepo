import { expect, test } from "vitest"
import { bold, italic } from "./format.js"

test("bold function", () => {
	const result = bold("Hello")
	expect(result).toBe("\x1b[1mHello\x1b[0m")
})

test("italic function", () => {
	const result = italic("World")
	expect(result).toBe("\x1b[3mWorld\x1b[0m")
})
