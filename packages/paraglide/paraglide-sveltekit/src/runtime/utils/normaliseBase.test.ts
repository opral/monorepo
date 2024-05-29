import { describe, it, expect } from "vitest"
import { normaliseBase } from "./normaliseBase"

describe("normaliseBase", () => {
	it("should return '' if base is empty", () => {
		expect(normaliseBase("", new URL("http://example.com/some-subpage"))).toBe("")
	})

	it("should return absolute path if base is relative", () => {
		expect(normaliseBase("..", new URL("http://example.com/a/b/c/"))).toBe("/a/b/")
	})

	it("should return '' if base is at the root", () => {
		expect(normaliseBase("..", new URL("http://example.com/some-subpage"))).toBe("")
	})

	it("should return absolute path if base is absolute", () => {
		expect(normaliseBase("/a/b/", new URL("http://example.com/a/b/c/"))).toBe("/a/b/")
	})
})
