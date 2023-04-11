import { describe, expect, test, vi } from "vitest"
import { navigatorDetector } from "./navigatorDetector.js"

const langs = ["en", "de", "en-GB"]

vi.stubGlobal("window", {
	navigator: {
		languages: langs,
	},
})

describe("navigatorDetector", () => {
	test("returns languages from window object", () => {
		const detector = navigatorDetector
		expect(detector()).toEqual(langs)
	})
})
