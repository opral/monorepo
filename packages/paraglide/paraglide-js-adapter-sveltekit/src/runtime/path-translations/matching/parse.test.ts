import { describe, it, expect } from "vitest"
import { parsePathDefinition } from "./parse"

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
		const parsed = parsePathDefinition("/foo/[id]")

		expect(parsed).toEqual([
			{
				type: "static",
				value: "foo",
			},
			{
				type: "param",
				name: "id",
				optional: false,
				catchAll: false,
			},
		])
	})

	it("parses an optional param", () => {
		const parsed = parsePathDefinition("/foo/[[id]]")
		expect(parsed).toEqual([
			{
				type: "static",
				value: "foo",
			},
			{
				type: "param",
				name: "id",
				optional: true,
				catchAll: false,
			},
		])
	})

	it("parses a catchall param", () => {
		const parsed = parsePathDefinition("/foo/[...slug]")
		expect(parsed).toEqual([
			{
				type: "static",
				value: "foo",
			},
			{
				type: "param",
				name: "slug",
				optional: false,
				catchAll: true,
			},
		])
	})

	it("parses multiple params", () => {
		const parsed = parsePathDefinition("/foo/[id]/bar/[...slug]")
		expect(parsed).toEqual([
			{
				type: "static",
				value: "foo",
			},
			{
				type: "param",
				name: "id",
				optional: false,
				catchAll: false,
			},
			{
				type: "static",
				value: "bar",
			},
			{
				type: "param",
				name: "slug",
				optional: false,
				catchAll: true,
			},
		])
	})
})
