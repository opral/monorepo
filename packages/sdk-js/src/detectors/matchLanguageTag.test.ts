import { describe, expect, test } from "vitest"
import { matchLanguageTag } from "./matchLanguageTag.js"

describe("matchLanguageTag", () => {
	describe("allowRelated = false", () => {
		test("return a perfect match", () => {
			const detectedLanguages = ["fr", "de", "en", "fr"]
			const languageTags = ["de-AT", "de", "en-GB"]
			const languageTag = matchLanguageTag(detectedLanguages, languageTags, false)
			expect(languageTag).toBe("de")
		})

		test("return a perfect match for a single detected string", () => {
			const detectedLanguages = ["de"]
			const languageTags = ["de-AT", "de", "en-GB"]
			const languageTag = matchLanguageTag(detectedLanguages, languageTags, false)
			expect(languageTag).toBe("de")
		})

		test("with multiple perfect matches, return the one that was detected earlier", () => {
			const detectedLanguages = ["fr", "en", "de", "fr"]
			const languageTags = ["de-AT", "de", "en-GB", "en"]
			const languageTag = matchLanguageTag(detectedLanguages, languageTags, false)
			expect(languageTag).toBe("en")
		})

		test("return undefined if there is no perfect match", () => {
			const detectedLanguages = ["de-AT", "en", "en-GB"]
			const languageTags = ["fr", "es"]
			const languageTag = matchLanguageTag(detectedLanguages, languageTags, false)
			expect(languageTag).toBe(undefined)
		})

		test("return undefined for empty languageTags", () => {
			const detectedLanguages = ["de", "en-GB"]
			const languageTags = [] as string[]
			const languageTag = matchLanguageTag(detectedLanguages, languageTags, false)
			expect(languageTag).toBe(undefined)
		})
	})

	describe("allowRelated = true", () => {
		test("return a related, less specific match", () => {
			const detectedLanguages = ["de-AT", "en-GB", "fr"]
			const languageTags = ["de", "es"]
			const languageTag = matchLanguageTag(detectedLanguages, languageTags)
			expect(languageTag).toBe("de")
		})

		test("return a related, more specific match", () => {
			const detectedLanguages = ["de-AT", "en", "fr"]
			const languageTags = ["en-GB", "es"]
			const languageTag = matchLanguageTag(detectedLanguages, languageTags)
			expect(languageTag).toBe("en-GB")
		})

		test("prefer the less specific over the more specific related match", () => {
			const detectedLanguages = ["de-AT", "en", "fr"]
			const languageTags = ["en-GB", "de"]
			const languageTag = matchLanguageTag(detectedLanguages, languageTags)
			expect(languageTag).toBe("de")
		})

		test("return undefined if there is no related match", () => {
			const detectedLanguages = ["de-AT", "en", "en-GB"]
			const languageTags = ["fr", "es"]
			const languageTag = matchLanguageTag(detectedLanguages, languageTags)
			expect(languageTag).toBe(undefined)
		})

		test("apply alphabetical sort amongst equally specific related matches", () => {
			const detectedLanguages = ["de", "en-GB"]
			const languageTags = ["fr", "de-CH", "de-AT"]
			const languageTag = matchLanguageTag(detectedLanguages, languageTags)
			expect(languageTag).toBe("de-AT")
		})

		test("prefer a perfect match", () => {
			const detectedLanguages = ["de-AT", "en"]
			const languageTags = ["en", "de"]
			const languageTag = matchLanguageTag(detectedLanguages, languageTags)
			expect(languageTag).toBe("en")
		})

		test("with multiple matches, return the one that was detected earlier", () => {
			const detectedLanguages = ["en", "fr", "de"]
			const languageTags = ["de-AT", "fr-FR"]
			const languageTag = matchLanguageTag(detectedLanguages, languageTags)
			expect(languageTag).toBe("fr-FR")
		})
	})
})
