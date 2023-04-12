import { describe, expect, test, vi } from "vitest"
import { initSessionStorageDetector, sessionStorageDetector } from "./sessionStorageDetector.js"

const language = "fr"

const storage = {
	language,
}

vi.stubGlobal("sessionStorage", { getItem: (key: string) => storage[key as keyof typeof storage] })

describe("localStorageDetector", () => {
	test("returns languages from window object", () => {
		const detector = sessionStorageDetector
		expect(detector()).toEqual([language])
	})
})

describe("sessionLocalStorageDetector", () => {
	test("returns the language from the sessionStorage", () => {
		const detector = initSessionStorageDetector("language")
		expect(detector()).toEqual([language])
	})

	test("returns an empty array if not present", () => {
		const detector = initSessionStorageDetector("lang")
		expect(detector()).toEqual([])
	})
})
