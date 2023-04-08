import { describe, expect, test, vi } from "vitest"
import { detectLanguage } from "./detectLanguage.js"
import type { Detector } from "@inlang/core/ast"
import { matchLanguage } from "./matchLanguage.js"

vi.mock("./matchLanguage", () => {
	return {
		matchLanguage: vi.fn(() => "lang"),
	}
})

describe("detectLanguage", () => {
	test("Returns fallback language for empty strategies set", () => {
		const parameters = {
			strategies: new Set<Detector>(),
			fallbackLanguage: "en",
			availableLanguages: new Set(["de", "fr", "en"]),
			allowRelated: false,
		}
		const detected = detectLanguage(parameters)
		expect(detected).toBe("en")
	})
	test("Returns immediately after first match is found", () => {
		vi.mocked(matchLanguage).mockImplementation(() => "lang")
		const detectors = [vi.fn(), vi.fn(), vi.fn()]
		const parameters = {
			strategies: new Set<Detector>(detectors),
			fallbackLanguage: "",
			availableLanguages: new Set([]),
			allowRelated: false,
		}
		const detected = detectLanguage(parameters)
		expect(matchLanguage).toBeCalledTimes(1)
		expect(detected).toBe("lang")
	})
	test("Matches related languages", () => {
		vi.mocked(matchLanguage).mockReturnValue("related lang")
		const parameters = {
			strategies: new Set<Detector>(),
			fallbackLanguage: "lang",
			availableLanguages: new Set([]),
			allowRelated: true,
		}
		const detected = detectLanguage(parameters)
		expect(detected).toBe("related lang")
	})
	test("Match related langs with allowRelated true and accumuluated detector results", () => {
		vi.mocked(matchLanguage).mockReturnValue(undefined)
		const detectors = [vi.fn(() => "de"), vi.fn(() => ["en", "fr"]), vi.fn(() => "es")]
		const parameters = {
			strategies: new Set<Detector>(detectors),
			fallbackLanguage: "lang",
			availableLanguages: new Set([]),
			allowRelated: true,
		}
		detectLanguage(parameters)
		expect(matchLanguage).toBeCalledWith(
			["de", "en", "fr", "es"],
			parameters.availableLanguages,
			parameters.allowRelated,
		)
	})
})
