import { i } from "./identifier.js"
import { expect, test } from "vitest"

test('escapes "-" to "_"', () => {
	expect(i("de-DE-bavaria")).toBe("de_DE_bavaria")
})

test("prefixes with _ if it starts with a number", () => {
	expect(i("123")).toBe("_123")
})
