import { it, expect } from "vitest"
import { getFallbackLanguages } from "./index.js"

it("returns an empty array if the language tag is the same as the source language tag", () => {
	expect(getFallbackLanguages(["en-US"] as const, "en-US")).toEqual({
		"en-US": [],
	})
})

it("Uses the source-language as a fallback if no other fallbacks are available", () => {
	expect(getFallbackLanguages(["en-US", "en-GB"] as const, "en-GB")).toEqual({
		"en-US": ["en-GB"],
		"en-GB": [],
	})
})

it("uses region fallbacks if available", () => {
	expect(getFallbackLanguages(["de-CH-ZH", "de-CH", "de", "en"] as const, "en")).toEqual({
		"de-CH-ZH": ["de-CH", "de", "en"],
		"de-CH": ["de", "en"],
		de: ["en"],
		en: [],
	})
})

it("uses region fallbacks, even if chain is not complete if available", () => {
	expect(getFallbackLanguages(["de-CH-ZH", "de", "en"], "en")).toEqual({
		"de-CH-ZH": ["de", "en"],
		de: ["en"],
		en: [],
	})
})

it("stops region fallbacks if it hits the source language", () => {
	expect(getFallbackLanguages(["de-CH-ZH", "de-CH", "de"], "de-CH")).toEqual({
		"de-CH-ZH": ["de-CH"],
		"de-CH": [],
		de: ["de-CH"],
	})
})
