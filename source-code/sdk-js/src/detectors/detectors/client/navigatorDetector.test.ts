import { describe, expect, test, vi } from "vitest"
import { navigatorDetector } from "./navigatorDetector.js"
import type { LanguageTag } from '@inlang/core/languageTag'

const languageTags = ["en", "de", "en-GB"] satisfies LanguageTag[]

vi.stubGlobal("window", { navigator: { languages: languageTags } })

describe("navigatorDetector", () => {
	test("returns languageTags from window object", () => {
		const detector = navigatorDetector
		expect(detector()).toEqual(languageTags)
	})
})
