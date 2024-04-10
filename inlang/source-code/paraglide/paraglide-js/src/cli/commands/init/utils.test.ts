import { describe, it, expect } from "vitest"
import { getCommonPrefix } from "./utils.js"

describe("getCommonPrefix()", () => {
	it("returns the common prefix of two strings", () => {
		expect(getCommonPrefix(["foo", "foobar"])).toBe("foo")
		expect(getCommonPrefix(["foobar", "foo"])).toBe("foo")
	})
})
