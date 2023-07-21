import { describe, expect, test, vi } from "vitest"
import { initSessionStorageDetector, sessionStorageDetector } from "./sessionStorageDetector.js"
import type { LanguageTag } from '@inlang/core/languageTag'

const languageTag = "fr" satisfies LanguageTag

const storage = {
	languageTag,
}

vi.stubGlobal("sessionStorage", { getItem: (key: string) => storage[key as keyof typeof storage] })

describe("localStorageDetector", () => {
	test("returns languageTags from window object", () => {
		const detector = sessionStorageDetector
		expect(detector()).toEqual([languageTag])
	})
})

describe("sessionLocalStorageDetector", () => {
	test("returns the languageTag from the sessionStorage", () => {
		const detector = initSessionStorageDetector("languageTag")
		expect(detector()).toEqual([languageTag])
	})

	test("returns an empty array if not present", () => {
		const detector = initSessionStorageDetector("lang")
		expect(detector()).toEqual([])
	})
})
