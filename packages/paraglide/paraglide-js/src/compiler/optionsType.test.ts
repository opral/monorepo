import { it, expect, describe } from "vitest"
import { optionsType } from "./optionsType.js"

describe("optionsType", () => {
	it("should return valid jsdoc for options", () => {
		const jsdoc = optionsType({ languageTags: ["en", "de"] })
		expect(jsdoc).toBe('@param {{ languageTag?: "en" | "de" }} options')
	})
})
