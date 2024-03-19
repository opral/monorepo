import { describe, it, expect } from "vitest"
import { preferredLanguages } from "./language"

describe("preferredLanguages", () => {
	it("should return the acceptable languages", () => {
		expect(preferredLanguages("de-CH", ["de", "de-CH"])).toEqual(["de-CH", "de"])
	})

	it("should return an empty array if there are no acceptable languages", () => {
		expect(preferredLanguages("de-CH", [])).toEqual([])
	})

	it("should sort the matches by quality", () => {
		const headerValue = "fr-CH, fr;q=0.6, en;q=0.8, de;q=0.7, *;q=0.5"
		expect(preferredLanguages(headerValue, ["fr-CH", "fr", "en", "de", "*"])).toEqual([
			"fr-CH",
			"en",
			"de",
			"fr",
			"*",
		])
	})
})
