import { describe, it, expect } from "vitest"
import { getTranslatedPath } from "./getTranslatedPath"

describe("getTranslatedPath", () => {
	it("returns the path if no translations are given", () => {
		const translatedPath = getTranslatedPath("/foo", "en", {}, {})
		expect(translatedPath).toBe("/foo")
	})

	it("returns the translated path (no params)", () => {
		const translatedPath = getTranslatedPath(
			"/foo",
			"en",
			{
				"/foo": {
					en: "/bar",
					de: "/baz",
				},
			},
			{}
		)
		expect(translatedPath).toBe("/bar")
	})

	it("returns the translated path (with params)", () => {
		const translatedPath = getTranslatedPath(
			"/foo/123/asd",
			"en",
			{
				"/foo/[id]/asd": {
					en: "/bar/[id]/cvb",
					de: "/baz/[id]/cvb",
				},
			},
			{}
		)
		expect(translatedPath).toBe("/bar/123/cvb")
	})
})
