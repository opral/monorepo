import { describe, it, expect } from "vitest"
import { isExternal } from "./href"

describe("isExternal", () => {
	it("returns true for external links", () => {
		expect(isExternal("mailto:hello@test.com")).toBe(true)
		expect(isExternal("https://acme.com")).toBe(true)
		expect(isExternal("http://acme.com")).toBe(true)
	})

	it("does not return true for path-only links", () => {
		expect(isExternal("/some/path")).toBe(false)
		expect(isExternal("some/path")).toBe(false)
		expect(isExternal("")).toBe(false)
	})

	it("does not return true for hash-only links", () => {
		expect(isExternal("#hash")).toBe(false)
	})

	it("does not return true for query-only links", () => {
		expect(isExternal("?foo=bar")).toBe(false)
	})
})
