import { describe, expect, test, vi } from "vitest"
import { initLocalStorageDetector, localStorageDetector } from "./localStorageDetector.js"

const language = "de"

const storage = {
	language,
}

vi.stubGlobal("localStorage", { getItem: (key: string) => storage[key as keyof typeof storage] })

describe("localStorageDetector", () => {
	test("returns languages from window object", () => {
		const detector = localStorageDetector
		expect(detector()).toEqual([language])
	})
})

describe("initLocalStorageDetector", () => {
	test("returns the language from the localStorage", () => {
		const detector = initLocalStorageDetector("language")
		expect(detector()).toEqual([language])
	})

	test("returns an empty array if not present", () => {
		const detector = initLocalStorageDetector("lang")
		expect(detector()).toEqual([])
	})
})
