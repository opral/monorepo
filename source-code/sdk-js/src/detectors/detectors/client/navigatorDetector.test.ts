import { describe, expect, test, vi } from "vitest"
import { navigatorDetector } from "./navigatorDetector.js"

const languages = ["en", "de", "en-GB"]

vi.stubGlobal("window", { navigator: { languages } })

describe("navigatorDetector", () => {
	test("returns languages from window object", () => {
		const detector = navigatorDetector
		expect(detector()).toEqual(languages)
	})
})
