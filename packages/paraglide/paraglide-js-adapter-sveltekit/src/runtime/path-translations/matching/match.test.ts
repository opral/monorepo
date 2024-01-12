import { describe, it, expect } from "vitest"
import { matches } from "./match"

describe("match", () => {
	it("matches a static path", () => {
		const match = matches("/foo", "/foo")
		expect(match).toEqual({
			matches: true,
			params: {},
		})
	})

	it("matches a path with a param", () => {
		const match = matches("/bar/123", "/bar/[id]")
		expect(match).toEqual({
			matches: true,
			params: {
				id: "123",
			},
		})
	})

	it("matches a path with multiple params", () => {
		const match = matches("/foo/bar/baz", "/foo/[id]/[slug]")
		expect(match).toEqual({
			matches: true,
			params: {
				id: "bar",
				slug: "baz",
			},
		})
	})
})
