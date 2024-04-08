import { describe, it, expect } from "vitest"
import { parse_route_id } from "./routing"

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
