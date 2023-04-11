import { describe, expect, test } from "vitest"
import { matchLanguage } from "./matchLanguage.js"

describe("matchLanguage", () => {
	test("return a perfect match", () => {
		const detectedLanguages = ["fr", "de", "en", "fr"]
		const availableLanguages = ["de-AT", "de", "en-GB"]
		const language = matchLanguage(detectedLanguages, availableLanguages)
		expect(language).toBe("de")
	})

	test("return a perfect match for a single detected string", () => {
		const detectedLanguages = ["de"]
		const availableLanguages = ["de-AT", "de", "en-GB"]
		const language = matchLanguage(detectedLanguages, availableLanguages)
		expect(language).toBe("de")
	})

	test("with multiple perfect matches, return the one that was detected earlier", () => {
		const detectedLanguages = ["fr", "en", "de", "fr"]
		const availableLanguages = ["de-AT", "en", "de", "en-GB"]
		const language = matchLanguage(detectedLanguages, availableLanguages)
		expect(language).toBe("en")
	})

	test("return undefined if there is no perfect match", () => {
		const detectedLanguages = ["de-AT", "en", "en-GB"]
		const availableLanguages = ["fr", "es"]
		const language = matchLanguage(detectedLanguages, availableLanguages)
		expect(language).toBe(undefined)
	})

	test("return a related, less specific match", () => {
		const detectedLanguages = ["de-AT", "en-GB", "fr"]
		const availableLanguages = ["de", "es"]
		const language = matchLanguage(detectedLanguages, availableLanguages, true)
		expect(language).toBe("de")
	})

	test("return a related, more specific match", () => {
		const detectedLanguages = ["de-AT", "en", "fr"]
		const availableLanguages = ["en-GB", "es"]
		const language = matchLanguage(detectedLanguages, availableLanguages, true)
		expect(language).toBe("en-GB")
	})

	test("prefer the less specific over the more specific related match", () => {
		const detectedLanguages = ["de-AT", "en", "fr"]
		const availableLanguages = ["en-GB", "de"]
		const language = matchLanguage(detectedLanguages, availableLanguages, true)
		expect(language).toBe("de")
	})

	test("return undefined if there is no related match", () => {
		const detectedLanguages = ["de-AT", "en", "en-GB"]
		const availableLanguages = ["fr", "es"]
		const language = matchLanguage(detectedLanguages, availableLanguages, true)
		expect(language).toBe(undefined)
	})

	test("apply alphabetical sort amongst equally specific related matches", () => {
		const detectedLanguages = ["de", "en-GB"]
		const availableLanguages = ["fr", "de-CH", "de-AT"]
		const language = matchLanguage(detectedLanguages, availableLanguages, true)
		expect(language).toBe("de-AT")
	})

	test("return undefined for empty detection", () => {
		const detectedLanguages: string[] = []
		const availableLanguages = ["de-AT", "de", "en-GB"]
		const language = matchLanguage(detectedLanguages, availableLanguages)
		expect(language).toBe(undefined)
	})

	test("return undefined for undefined detection", () => {
		const detectedLanguages = [] as string[]
		const availableLanguages = ["de-AT", "de", "en-GB"]
		const language = matchLanguage(detectedLanguages, availableLanguages)
		expect(language).toBe(undefined)
	})

	test("return undefined for empty availableLanguages", () => {
		const detectedLanguages = ["de", "en-GB"]
		const availableLanguages = [] as string[]
		const language = matchLanguage(detectedLanguages, availableLanguages)
		expect(language).toBe(undefined)
	})
})
