import { beforeEach, describe, expect, test, vi } from "vitest"
import { detectLanguageTag } from "./detectLanguageTag.js"
import { matchLanguageTag } from "./matchLanguageTag.js"
import type { Detector } from "./types.js"

vi.mock("./matchLanguageTag.js", () => {
	return {
		matchLanguageTag: vi.fn((detectedLanguages: string[], languageTags: string[], allowRelated = true) =>
			languageTags.find((lang) =>
				detectedLanguages.some((l) =>
					allowRelated ? l.startsWith(lang) || lang.startsWith(l) : l === lang,
				),
			),
		),
	}
})

describe("detectLanguageTag", () => {
	beforeEach(() => {
		vi.restoreAllMocks()
	})

	test("Returns fallback languageTag if no detector gets passed", async () => {
		const sourceLanguageTag = "en"
		const detected = await detectLanguageTag(
			{
				sourceLanguageTag,
				languageTags: ["de", "fr", "en"],
				allowRelated: false,
			},
			...[],
		)
		expect(matchLanguageTag).toBeCalledTimes(0)
		expect(detected).toBe(sourceLanguageTag)
	})

	test("Returns fallback languageTag if no detector finds a match", async () => {
		const sourceLanguageTag = "en"
		const detectors: Detector[] = [
			vi.fn(() => ["it"]),
			vi.fn(() => Promise.resolve(["de"])),
			vi.fn(async () => []),
		]
		const detected = await detectLanguageTag(
			{
				sourceLanguageTag,
				languageTags: ["en", "fr"],
				allowRelated: false,
			},
			...detectors,
		)
		expect(matchLanguageTag).toBeCalledTimes(3)
		expect(detected).toBe(sourceLanguageTag)
	})

	test("Returns immediately after first match is found", async () => {
		const detectors: Detector[] = [vi.fn(() => ["de"]), vi.fn(() => []), vi.fn(() => [])]
		const detected = await detectLanguageTag(
			{
				sourceLanguageTag: "en",
				languageTags: ["de", "en"],
				allowRelated: false,
			},
			...detectors,
		)
		expect(matchLanguageTag).toBeCalledTimes(1)
		expect(detected).toBe("de")
	})

	test("should call all detectors and check for exact matches first", async () => {
		const detectors: Detector[] = [
			vi.fn(() => ["de-DE"]),
			vi.fn(async () => ["fr"]),
			vi.fn(() => ["it"]),
		]
		const detected = await detectLanguageTag(
			{
				sourceLanguageTag: "en",
				languageTags: ["de", "en"],
			},
			...detectors,
		)
		expect(matchLanguageTag).toBeCalledTimes(4)
		expect(detected).toBe("de")
	})
})
