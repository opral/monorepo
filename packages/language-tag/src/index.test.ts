import { it, expect } from "vitest"
import { getLookupOrder } from "./index.js"

it("returns the source language tag for the source language tag", () => {
	expect(getLookupOrder(["en-US"] as const, "en-US")).toEqual({
		"en-US": ["en-US"],
	})
})

it("Uses the source-language as a fallback if no other fallbacks are available", () => {
	expect(getLookupOrder(["en-US", "en-GB"] as const, "en-GB")).toEqual({
		"en-US": ["en-US", "en-GB"],
		"en-GB": ["en-GB"],
	})
})

it("uses region fallbacks in descending specificity if available", () => {
	expect(getLookupOrder(["de-CH-ZH", "de-CH", "de", "en"] as const, "en")).toEqual({
		"de-CH-ZH": ["de-CH-ZH", "de-CH", "de", "en"],
		"de-CH": ["de-CH", "de", "en"],
		de: ["de", "en"],
		en: ["en"],
	})
})

it("uses region fallbacks, even if chain is not complete if available", () => {
	expect(getLookupOrder(["de-CH-ZH", "de", "en"] as const, "en")).toEqual({
		"de-CH-ZH": ["de-CH-ZH", "de", "en"],
		de: ["de", "en"],
		en: ["en"],
	})
})

it("stops region fallbacks if it hits the source language", () => {
	expect(getLookupOrder(["de-CH-ZH", "de-CH", "de"] as const, "de-CH")).toEqual({
		"de-CH-ZH": ["de-CH-ZH", "de-CH"],
		"de-CH": ["de-CH"],
		de: ["de", "de-CH"],
	})
})
