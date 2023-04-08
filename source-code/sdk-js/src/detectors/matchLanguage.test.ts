import { describe, expect, test } from "vitest"
import { matchLanguage } from "./matchLanguage.js"

describe("matchLanguage", () => {
	test("return a perfect match", () => {
		const detected = ["fr", "de", "en", "fr"]
		const availableLanguages = new Set(["de-AT", "de", "en-GB"])
		const lang = matchLanguage(detected, availableLanguages)
		expect(lang).toBe("de")
	})
	test("return a perfect match for a single detected string", () => {
		const detected = "de"
		const availableLanguages = new Set(["de-AT", "de", "en-GB"])
		const lang = matchLanguage(detected, availableLanguages)
		expect(lang).toBe("de")
	})
	test("with multiple perfect matches, return the one that was detected earlier", () => {
		const detected = ["fr", "en", "de", "fr"]
		const availableLanguages = new Set(["de-AT", "en", "de", "en-GB"])
		const lang = matchLanguage(detected, availableLanguages)
		expect(lang).toBe("en")
	})
	test("return undefined if there is no perfect match", () => {
		const detected = ["de-AT", "en", "en-GB"]
		const availableLanguages = new Set(["fr", "es"])
		const lang = matchLanguage(detected, availableLanguages)
		expect(lang).toBe(undefined)
	})
	test("return a related, less specific match", () => {
		const detected = ["de-AT", "en-GB", "fr"]
		const availableLanguages = new Set(["de", "es"])
		const lang = matchLanguage(detected, availableLanguages, true)
		expect(lang).toBe("de")
	})
	test("return a related, more specific match", () => {
		const detected = ["de-AT", "en", "fr"]
		const availableLanguages = new Set(["en-GB", "es"])
		const lang = matchLanguage(detected, availableLanguages, true)
		expect(lang).toBe("en-GB")
	})
	test("prefer the less specific over the more specific related match", () => {
		const detected = ["de-AT", "en", "fr"]
		const availableLanguages = new Set(["en-GB", "de"])
		const lang = matchLanguage(detected, availableLanguages, true)
		expect(lang).toBe("de")
	})
	test("return undefined if there is no related match", () => {
		const detected = ["de-AT", "en", "en-GB"]
		const availableLanguages = new Set(["fr", "es"])
		const lang = matchLanguage(detected, availableLanguages, true)
		expect(lang).toBe(undefined)
	})
	test("apply alphabetical sort amongst equally specific related matches", () => {
		const detected = ["de", "en-GB"]
		const availableLanguages = new Set(["fr", "de-CH", "de-AT"])
		const lang = matchLanguage(detected, availableLanguages, true)
		expect(lang).toBe("de-AT")
	})
	test("return undefined for empty detection", () => {
		const detected: string[] = []
		const availableLanguages = new Set(["de-AT", "de", "en-GB"])
		const lang = matchLanguage(detected, availableLanguages)
		expect(lang).toBe(undefined)
	})
	test("return undefined for undefined detection", () => {
		const detected = undefined
		const availableLanguages = new Set(["de-AT", "de", "en-GB"])
		const lang = matchLanguage(detected, availableLanguages)
		expect(lang).toBe(undefined)
	})
	test("return undefined for empty availableLanguages", () => {
		const detected = ["de", "en-GB"]
		const availableLanguages = new Set([])
		const lang = matchLanguage(detected, availableLanguages)
		expect(lang).toBe(undefined)
	})
})
