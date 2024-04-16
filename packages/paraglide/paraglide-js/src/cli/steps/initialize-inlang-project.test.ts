import { describe, it, expect } from "vitest"
import { getCommonPrefix } from "./initialize-inlang-project.js"

describe("getCommonPrefix()", () => {
	it("returns the common prefix of two strings", () => {
		expect(getCommonPrefix(["foo", "foobar"])).toBe("foo")
		expect(getCommonPrefix(["foobar", "foo"])).toBe("foo")
	})

	it("The common prefix of a single string is ''", () => {
		expect(getCommonPrefix(["foo"])).toBe("")
	})
})
