import { describe, it, expect } from "vitest"
import { PrefixStrategy } from "./strategy"

describe("PrefixStrategy", () => {
	const strategy = PrefixStrategy(
		["en", "de"],
		"en",
		{
			"/about": {
				en: "/about",
				de: "/ueber-uns",
			},
		},
		{},
		"never"
	)

	it("detects the language", () => {
		expect(strategy.getLanguageFromLocalisedPath("/about")).toBe("en")
		expect(strategy.getLanguageFromLocalisedPath("/de/ueber-uns")).toBe("de")
	})

	it("gets the canonical path if no translation exists", () => {
		expect(strategy.getCanonicalPath("/de/some-page", "de")).toBe("/some-page")
	})

	it("gets the canonical path of a path with just the language prefix", () => {
		expect(strategy.getCanonicalPath("/de", "de")).toBe("/")
	})

	it("gets the canonical path with a translation", () => {
		expect(strategy.getCanonicalPath("/de/ueber-uns", "de")).toBe("/about")
	})

	it("gets the localised path if no translation exists", () => {
		expect(strategy.getLocalisedPath("/some-page", "de")).toBe("/de/some-page")
		expect(strategy.getLocalisedPath("/some-page", "en")).toBe("/some-page")
	})
})
