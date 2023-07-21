import { describe, expect, test, vi } from "vitest"
import { initLocalStorageDetector, localStorageDetector } from "./localStorageDetector.js"
import type { LanguageTag } from '@inlang/core/languageTag'

const languageTag = "de" satisfies LanguageTag

const storage = {
	languageTag,
}

vi.stubGlobal("localStorage", { getItem: (key: string) => storage[key as keyof typeof storage] })

describe("localStorageDetector", () => {
	test("returns languageTags from window object", () => {
		const detector = localStorageDetector
		expect(detector()).toEqual([languageTag])
	})
})

describe("initLocalStorageDetector", () => {
	test("returns the languageTag from the localStorage", () => {
		const detector = initLocalStorageDetector("languageTag")
		expect(detector()).toEqual([languageTag])
	})

	test("returns an empty array if not present", () => {
		const detector = initLocalStorageDetector("lang")
		expect(detector()).toEqual([])
	})
})
