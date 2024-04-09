import { describe, it, expect } from "vitest"
import { bestMatch } from "./match"

describe("match", () => {
	it("matches a static path", () => {
		const match = bestMatch("/foo", ["/foo"], {})
		expect(match).toEqual({
			id: "/foo",
			params: {},
		})
	})

	it("matches a path with a param", () => {
		const match = bestMatch("/bar/123", ["/bar/[id]"], {})
		expect(match).toEqual({
			id: "/bar/[id]",
			params: {
				id: "123",
			},
		})
	})

	it("matches a path with multiple params", () => {
		const match = bestMatch("/foo/bar/baz", ["/foo/[id]/[slug]"], {})
		expect(match).toEqual({
			id: "/foo/[id]/[slug]",
			params: {
				id: "bar",
				slug: "baz",
			},
		})
	})

	it("prefers paths with no params", () => {
		const match = bestMatch("/foo/bar/baz", ["/foo/[id]/[slug]", "/foo/bar/baz"], {})
		expect(match).toEqual({
			id: "/foo/bar/baz",
			params: {},
		})
	})

	it("doesn't match on partial matches", () => {
		const match = bestMatch("/", ["/admin"], {})
		expect(match).toBeUndefined()
	})

	it("matches a path with a param that's not it's own segment", () => {
		const match = bestMatch("/foo/bar-123", ["/foo/bar-[id]"], {})
		expect(match).toEqual({
			id: "/foo/bar-[id]",
			params: {
				id: "123",
			},
		})
	})

	it("prefers matches with fewer params", () => {
		const match = bestMatch("/foo/bar/baz", ["/foo/[id]/baz", "/foo/[id]/[slug]"], {})
		expect(match).toEqual({
			id: "/foo/[id]/baz",
			params: {
				id: "bar",
			},
		})
	})

	it("matches optional catchalls", () => {
		const match = bestMatch("/foo/bar/baz", ["/foo/[[...rest]]"], {})
		expect(match).toEqual({
			id: "/foo/[[...rest]]",
			params: {
				rest: "bar/baz",
			},
		})
	})

	it("doesn't match if the matcher doesn't pass", () => {
		const match = bestMatch("/foo/bar", ["/foo/[params=foo]"], {
			foo: (param) => param === "foo",
		})
		expect(match).toBeUndefined()
	})

	it("Uses params to disambiguate", () => {
		const match = bestMatch("/foo/bar", ["/foo/[params=bar]", "/foo/[params=foo]"], {
			foo: (param) => param === "foo",
			bar: (param) => param === "bar",
		})
		expect(match).toEqual({
			id: "/foo/[params=bar]",
			params: {
				params: "bar",
			},
		})
	})
})
