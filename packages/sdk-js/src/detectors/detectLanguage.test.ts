import { beforeEach, describe, expect, test, vi } from "vitest"
import { detectLanguage } from "./detectLanguage.js"
import { matchLanguage } from "./matchLanguage.js"
import type { Detector } from "./types.js"

vi.mock("./matchLanguage.js", () => {
	return {
		matchLanguage: vi.fn((detectedLanguages: string[], languageTags: string[], allowRelated = true) =>
			languageTags.find((lang) =>
				detectedLanguages.some((l) =>
					allowRelated ? l.startsWith(lang) || lang.startsWith(l) : l === lang,
				),
			),
		),
	}
})

describe("detectLanguage", () => {
	beforeEach(() => {
		vi.restoreAllMocks()
	})

	test("Returns fallback languageTag if no detector gets passed", async () => {
		const sourceLanguageTag = "en"
		const detected = await detectLanguage(
			{
				sourceLanguageTag,
				languageTags: ["de", "fr", "en"],
				allowRelated: false,
			},
			...[],
		)
		expect(matchLanguage).toBeCalledTimes(0)
		expect(detected).toBe(sourceLanguageTag)
	})

	test("Returns fallback languageTag if no detector finds a match", async () => {
		const sourceLanguageTag = "en"
		const detectors: Detector[] = [
			vi.fn(() => ["it"]),
			vi.fn(() => Promise.resolve(["de"])),
			vi.fn(async () => []),
		]
		const detected = await detectLanguage(
			{
				sourceLanguageTag,
				languageTags: ["en", "fr"],
				allowRelated: false,
			},
			...detectors,
		)
		expect(matchLanguage).toBeCalledTimes(3)
		expect(detected).toBe(sourceLanguageTag)
	})

	test("Returns immediately after first match is found", async () => {
		const detectors: Detector[] = [vi.fn(() => ["de"]), vi.fn(() => []), vi.fn(() => [])]
		const detected = await detectLanguage(
			{
				sourceLanguageTag: "en",
				languageTags: ["de", "en"],
				allowRelated: false,
			},
			...detectors,
		)
		expect(matchLanguage).toBeCalledTimes(1)
		expect(detected).toBe("de")
	})

	test("should call all detectors and check for exact matches first", async () => {
		const detectors: Detector[] = [
			vi.fn(() => ["de-DE"]),
			vi.fn(async () => ["fr"]),
			vi.fn(() => ["it"]),
		]
		const detected = await detectLanguage(
			{
				sourceLanguageTag: "en",
				languageTags: ["de", "en"],
			},
			...detectors,
		)
		expect(matchLanguage).toBeCalledTimes(4)
		expect(detected).toBe("de")
	})
})
