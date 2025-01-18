import { describe, it, expect } from "vitest"
import { isExternal } from "./external"

describe("isExternal", () => {
	it("returns true if the origin is different", () => {
		const url = new URL("https://example.com")
		const currentUrl = new URL("https://example.org")
		const base = ""

		expect(isExternal(url, currentUrl, base)).toBe(true)
	})

	it("returns true if the pathname does not start with the base", () => {
		const url = new URL("https://example.com/foo")
		const currentUrl = new URL("https://example.com")
		const base = "/bar"

		expect(isExternal(url, currentUrl, base)).toBe(true)
	})

	it("returns false if the origin is the same and the pathname starts with the base", () => {
		const url = new URL("https://example.com/foo")
		const currentUrl = new URL("https://example.com")
		const base = "/foo"

		expect(isExternal(url, currentUrl, base)).toBe(false)
	})

	it("can deal with a relative base", () => {
		const url = new URL("https://example.com/foo")
		const currentUrl = new URL("https://example.com")
		const base = "."

		expect(isExternal(url, currentUrl, base)).toBe(false)
	})
})
