import { describe, it, expect } from "vitest"
import { exec, parse_route_id } from "./routing"

// we're testing known-good vendored in code here, but the test are still helpful to understand the logic

describe("parse_route_id", () => {
	it("should parse a route id", () => {
		expect(parse_route_id("/foo/bar")).toEqual({
			params: [],
			pattern: /^\/foo\/bar\/?$/,
		})

		expect(parse_route_id("/[lang]/test")).toEqual({
			params: [
				{
					chained: false,
					matcher: undefined,
					name: "lang",
					optional: false,
					rest: false,
				},
			],
			pattern: /^\/([^/]+?)\/test\/?$/,
		})

		expect(parse_route_id("/[[lang]]/test")).toEqual({
			params: [
				{
					chained: true,
					matcher: undefined,
					name: "lang",
					optional: true,
					rest: false,
				},
			],
			pattern: /^(?:\/([^/]+))?\/test\/?$/,
		})
	})
})

describe("exec", () => {
	it("returns the params of a path with a simple param", () => {
		const routeId = "/foo/[bar]/baz"
		const path = "/foo/123/baz"

		const route = parse_route_id(routeId)
		const match = route.pattern.exec(path)
		if (!match) throw new Error("no match")

		const params = exec(match, route.params, {})
		expect(params).toEqual({ bar: "123" })
	})

	it("works with optional params", () => {
		const routeId = "/foo/[[bar]]/baz"
		const path1 = "/foo/123/baz"
		const path2 = "/foo/baz"

		const route = parse_route_id(routeId)
		const match1 = route.pattern.exec(path1)
		const match2 = route.pattern.exec(path2)
		if (!match1) throw new Error("no match")
		if (!match2) throw new Error("no match")

		const params1 = exec(match1, route.params, {})
		const params2 = exec(match2, route.params, {})
		expect(params1).toEqual({ bar: "123" })
		expect(params2).toEqual({})
	})

	it("works with rest params", () => {
		const routeId = "/foo/[...bar]/baz"
		const path = "/foo/123/456/baz"

		const route = parse_route_id(routeId)
		const match = route.pattern.exec(path)
		if (!match) throw new Error("no match")

		const params = exec(match, route.params, {})
		expect(params).toEqual({ bar: "123/456" })
	})

	it("works if the param isn't it's own segment", () => {
		const routeId = "/foo-[bar]-baz"
		const path = "/foo-123-baz"

		const route = parse_route_id(routeId)
		const match = route.pattern.exec(path)
		if (!match) throw new Error("no match")

		const params = exec(match, route.params, {})
		expect(params).toEqual({ bar: "123" })
	})

	it("returns an empty object if there are no params", () => {
		const routeId = "/foo"
		const path = "/foo"

		const route = parse_route_id(routeId)
		const match = route.pattern.exec(path)
		if (!match) throw new Error("no match")

		const params = exec(match, route.params, {})
		expect(params).toEqual({})
	})

	it("works with matchers", () => {
		const routeId = "/foo/[bar=int]/baz"
		const path1 = "/foo/123/baz"
		const path2 = "/foo/abc/baz"

		const route = parse_route_id(routeId)
		const match1 = route.pattern.exec(path1)
		const match2 = route.pattern.exec(path2)
		if (!match1) throw new Error("no match")
		if (!match2) throw new Error("no match")

		const int = (s: string) => !Number.isNaN(parseInt(s, 10))

		const params1 = exec(match1, route.params, { int })
		const params2 = exec(match2, route.params, { int })
		expect(params1).toEqual({ bar: "123" })
		expect(params2).toBeUndefined()
	})
})
