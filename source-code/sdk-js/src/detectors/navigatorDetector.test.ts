import { describe, expect, test } from "vitest"
import { navigatorDetector } from "./navigatorDetector.js"

describe("navigatorDetector", () => {
	test("returns languages from window object", () => {
		const langs = ["en", "de", "en-GB"]
		//{...window,  navigator: { languages: ["en", "de", "en-GB"] } }
		expect(navigatorDetector({ window: { navigator: { languages: langs } } })).toStrictEqual(langs)
	})
})
