import { describe, it, expect } from "vitest"
import { getTranslatedPath } from "./translate"

describe("getTranslatedPath", () => {
	it("returns the path if no translations are given", () => {
		const translatedPath = getTranslatedPath("/foo", "en", {})
		expect(translatedPath).toBe("/foo")
	})

	it("returns the translated path (no params)", () => {
		const translatedPath = getTranslatedPath("/foo", "en", {
			"/foo": {
				en: "/bar",
				de: "/baz",
			},
		})
		expect(translatedPath).toBe("/bar")
	})
})
