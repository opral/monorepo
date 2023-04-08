import { describe, expect, test } from "vitest"
import { initNavigatorDetector } from "./navigatorDetector.js"

describe("navigatorDetector", () => {
	test("returns languages from window object", () => {
		const langs = ["en", "de", "en-GB"]
		const detector = initNavigatorDetector({ window: { navigator: { languages: langs } } })
		expect(detector()).toStrictEqual(langs)
	})
})
