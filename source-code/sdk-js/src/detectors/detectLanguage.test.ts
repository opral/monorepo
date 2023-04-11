import { beforeEach, describe, expect, test, vi } from "vitest"
import { detectLanguage } from "./detectLanguage.js"
import { matchLanguage } from "./matchLanguage.js"
import type { Detector } from "./types.js"

vi.mock("./matchLanguage.js", () => {
	return {
		matchLanguage: vi.fn((detectedLanguages: string[], languages: string[]) =>
			detectedLanguages.find((lang) => languages.includes(lang)),
		),
	}
})

describe("detectLanguage", () => {
	beforeEach(() => {
		vi.restoreAllMocks()
	})

	test("Returns fallback language if no detector gets passed", async () => {
		const referenceLanguage = "en"
		const detected = await detectLanguage(
			{
				referenceLanguage,
				languages: ["de", "fr", "en"],
				allowRelated: false,
			},
			...[],
		)
		expect(matchLanguage).toBeCalledTimes(0)
		expect(detected).toBe(referenceLanguage)
	})

	test("Returns fallback language if no detector finds a match", async () => {
		const referenceLanguage = "en"
		const detectors: Detector[] = [
			vi.fn(() => ["it"]),
			vi.fn(() => Promise.resolve(["de"])),
			vi.fn(async () => []),
		]
		const detected = await detectLanguage(
			{
				referenceLanguage,
				languages: ["en", "fr"],
				allowRelated: false,
			},
			...detectors,
		)
		expect(matchLanguage).toBeCalledTimes(3)
		expect(detected).toBe(referenceLanguage)
	})

	test("Returns immediately after first match is found", async () => {
		const detectors: Detector[] = [vi.fn(() => ["de"]), vi.fn(() => []), vi.fn(() => [])]
		const detected = await detectLanguage(
			{
				referenceLanguage: "en",
				languages: ["de", "en"],
				allowRelated: false,
			},
			...detectors,
		)
		expect(matchLanguage).toBeCalledTimes(1)
		expect(detected).toBe("de")
	})
})
