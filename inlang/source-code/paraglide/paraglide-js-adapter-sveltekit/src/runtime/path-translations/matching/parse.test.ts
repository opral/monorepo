import { describe, it, expect } from "vitest"
import { ParamSegment, parsePathDefinition } from "./parse"

describe("parsePathDefinition", () => {
	it("parses a static path", () => {
		const parsed = parsePathDefinition("/foo/bar")

		expect(parsed).toEqual([
			{
				type: "static",
				value: "foo",
			},
			{
				type: "static",
				value: "bar",
			},
		])
	})

	it("parses a simple param", () => {
		const parsed = parsePathDefinition("/[id]/")
		const expected: ParamSegment = {
			type: "param",
			name: "id",
			chained: false,
			optional: false,
			rest: false,
			matcher: undefined,
		}

		expect(parsed).toEqual([expected])
	})

	it("parses an optional param", () => {
		const parsed = parsePathDefinition("/[[id]]/")
		const expected: ParamSegment = {
			type: "param",
			name: "id",
			chained: true,
			optional: true,
			rest: false,
			matcher: undefined,
		}

		expect(parsed).toEqual([expected])
	})

	it("parses a rest param", () => {
		const parsed = parsePathDefinition("/[...slug]/")
		const expected: ParamSegment = {
			type: "param",
			name: "slug",
			chained: true,
			optional: false,
			rest: true,
			matcher: undefined,
		}

		expect(parsed).toEqual([expected])
	})

	it("parses an optional rest param", () => {
		const parsed = parsePathDefinition("/[[...slug]]/")
		const expected: ParamSegment = {
			type: "param",
			name: "slug",
			chained: true,
			optional: true,
			rest: true,
			matcher: undefined,
		}

		expect(parsed).toEqual([expected])
	})

	it("parses multiple params", () => {
		const parsed = parsePathDefinition("/foo/[id]/bar/[slug]")
		expect(parsed).toEqual([
			{
				type: "static",
				value: "foo",
			},
			{
				type: "param",
				name: "id",

				chained: false,
				matcher: undefined,
				optional: false,
				rest: false,
			},
			{
				type: "static",
				value: "bar",
			},
			{
				type: "param",
				name: "slug",
				chained: false,
				matcher: undefined,
				optional: false,
				rest: false,
			},
		])
	})

	it("parses a param that's not it's own segment", () => {
		const parsed = parsePathDefinition("/foo/bar-[id]")
		expect(parsed).toEqual([
			{
				type: "static",
				value: "/foo/bar-",
			},
			{
				type: "param",
				name: "id",
			},
		])
	})
})
