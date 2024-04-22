import { describe, it, expect } from "vitest"
import { getCanonicalPath } from "./getCanonicalPath"

describe("getCanonicalPath", () => {
	it("leaves the path unchanged if no translations are given", () => {
		const translatedPath = getCanonicalPath("/foo", "en", {}, {})
		expect(translatedPath).toBe("/foo")
	})

	it("leaves the path unchanged if no translations match", () => {
		const translatedPath = getCanonicalPath(
			"/",
			"en",
			{
				"/about": {
					en: "/about",
					de: "/uber-uns",
				},
			},
			{}
		)
		expect(translatedPath).toBe("/")
	})

	it("returns the translatedPath if no translations are given", () => {
		const translatedPath = getCanonicalPath("/foo", "en", {}, {})
		expect(translatedPath).toBe("/foo")
	})

	it("returns the canonical path in case of a match", () => {
		const canonicalPath = getCanonicalPath(
			"/bar",
			"en",
			{
				"/foo": {
					en: "/bar",
					de: "/baz",
				},
				"/bar": {
					en: "/foo",
					de: "/baz",
				},
			},
			{}
		)
		expect(canonicalPath).toBe("/foo")
	})

	it("returns the canonical path in case of a match", () => {
		const canonicalPath = getCanonicalPath(
			"/bar/123",
			"en",
			{
				"/foo/[id]": {
					en: "/bar/[id]",
					de: "/baz/[id]",
				},

				"/foo/[id]/[slug]": {
					en: "/bar/[id]/[slug]",
					de: "/baz/[id]/[slug]",
				},
			},
			{}
		)
		expect(canonicalPath).toBe("/foo/123")
	})

	it("returns the canonical path in case of a match with params", () => {
		const canonicalPath = getCanonicalPath(
			"/bar/123",
			"en",
			{
				"/foo/[id]": {
					en: "/bar/[id]",
					de: "/baz/[id]",
				},

				"/foo/[id]/[slug]": {
					en: "/bar/[id]/[slug]",
					de: "/baz/[id]/[slug]",
				},
			},
			{}
		)
		expect(canonicalPath).toBe("/foo/123")
	})

	it("returns the canonical path in case of a match with catch all", () => {
		const canonicalPath = getCanonicalPath(
			"/bar/123/baz",
			"en",
			{
				"/foo/[...rest]": {
					en: "/bar/[...rest]",
					de: "/baz/[...rest]",
				},
			},
			{}
		)
		expect(canonicalPath).toBe("/foo/123/baz")
	})

	it("returns the canonical path in case of a match with an optional catch all", () => {
		const canonicalPath = getCanonicalPath(
			"/bar/",
			"en",
			{
				"/foo/[...rest]": {
					en: "/bar/[...rest]",
					de: "/baz/[...rest]",
				},
			},
			{}
		)
		expect(canonicalPath).toBe("/foo")
	})
})
