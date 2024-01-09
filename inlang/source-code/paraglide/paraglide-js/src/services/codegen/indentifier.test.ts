import { i } from "./identifier.js"
import { expect, test } from "vitest"

test('escapes "-" to "_"', () => {
	expect(i("de-DE-bavaria")).toBe("de_DE_bavaria")
})
