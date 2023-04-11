import { describe, expect, test } from "vitest"
import { matchLanguage } from "./matchLanguage.js"

describe("matchLanguage", () => {
	describe("allowRelated = false", () => {
		test("return a perfect match", () => {
			const detectedLanguages = ["fr", "de", "en", "fr"]
			const languages = ["de-AT", "de", "en-GB"]
			const language = matchLanguage(detectedLanguages, languages)
			expect(language).toBe("de")
		})

		test("return a perfect match for a single detected string", () => {
			const detectedLanguages = ["de"]
			const languages = ["de-AT", "de", "en-GB"]
			const language = matchLanguage(detectedLanguages, languages)
			expect(language).toBe("de")
		})

		test("with multiple perfect matches, return the one that was detected earlier", () => {
			const detectedLanguages = ["fr", "en", "de", "fr"]
			const languages = ["de-AT", "de", "en-GB", "en"]
			const language = matchLanguage(detectedLanguages, languages)
			expect(language).toBe("en")
		})

		test("return undefined if there is no perfect match", () => {
			const detectedLanguages = ["de-AT", "en", "en-GB"]
			const languages = ["fr", "es"]
			const language = matchLanguage(detectedLanguages, languages)
			expect(language).toBe(undefined)
		})

		test("return undefined for empty languages", () => {
			const detectedLanguages = ["de", "en-GB"]
			const languages = [] as string[]
			const language = matchLanguage(detectedLanguages, languages)
			expect(language).toBe(undefined)
		})
	})

	describe("allowRelated = true", () => {
		test("return a related, less specific match", () => {
			const detectedLanguages = ["de-AT", "en-GB", "fr"]
			const languages = ["de", "es"]
			const language = matchLanguage(detectedLanguages, languages, true)
			expect(language).toBe("de")
		})

		test("return a related, more specific match", () => {
			const detectedLanguages = ["de-AT", "en", "fr"]
			const languages = ["en-GB", "es"]
			const language = matchLanguage(detectedLanguages, languages, true)
			expect(language).toBe("en-GB")
		})

		test("prefer the less specific over the more specific related match", () => {
			const detectedLanguages = ["de-AT", "en", "fr"]
			const languages = ["en-GB", "de"]
			const language = matchLanguage(detectedLanguages, languages, true)
			expect(language).toBe("de")
		})

		test("return undefined if there is no related match", () => {
			const detectedLanguages = ["de-AT", "en", "en-GB"]
			const languages = ["fr", "es"]
			const language = matchLanguage(detectedLanguages, languages, true)
			expect(language).toBe(undefined)
		})

		test("apply alphabetical sort amongst equally specific related matches", () => {
			const detectedLanguages = ["de", "en-GB"]
			const languages = ["fr", "de-CH", "de-AT"]
			const language = matchLanguage(detectedLanguages, languages, true)
			expect(language).toBe("de-AT")
		})

		test("prefer a perfect match", () => {
			const detectedLanguages = ["de-AT", "en"]
			const languages = ["en", "de"]
			const language = matchLanguage(detectedLanguages, languages, true)
			expect(language).toBe("en")
		})

		test("with multiple matches, return the one that was detected earlier", () => {
			const detectedLanguages = ["en", "fr", "de"]
			const languages = ["de-AT", "fr-FR"]
			const language = matchLanguage(detectedLanguages, languages, true)
			expect(language).toBe("fr-FR")
		})
	})
})
