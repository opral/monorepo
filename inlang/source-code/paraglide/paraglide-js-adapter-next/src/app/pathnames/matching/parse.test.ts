import { describe, it, expect } from "vitest"
import { parsePathDefinition } from "./parse"

describe("parsePathDefinition", () => {
	it("parses a static path", () => {
		const parsed = parsePathDefinition("/foo/bar")

		expect(parsed).toEqual([
			{
				type: "static",
				value: "/foo/bar",
			},
		])
	})

	it("parses a simple param", () => {
		const parsed = parsePathDefinition("/foo/[id]")

		expect(parsed).toEqual([
			{
				type: "static",
				value: "/foo/",
			},
			{
				type: "param",
				name: "id",
			},
		])
	})

	it("parses multiple params", () => {
		const parsed = parsePathDefinition("/foo/[id]/bar/[slug]")
		expect(parsed).toEqual([
			{
				type: "static",
				value: "/foo/",
			},
			{
				type: "param",
				name: "id",
			},
			{
				type: "static",
				value: "/bar/",
			},
			{
				type: "param",
				name: "slug",
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
