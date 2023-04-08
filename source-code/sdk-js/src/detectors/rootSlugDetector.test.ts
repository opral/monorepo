import { describe, expect, test } from "vitest"
import { initRootSlugDetector } from "./rootSlugDetector.js"

describe("rootSlugDetector", () => {
	test("return empty array if availableLanguages is Empty", () => {
		const availableLanguages = new Set([])
		const url = new URL("http://localhost:80/en/blue")
		const detector = initRootSlugDetector({ url, availableLanguages })
		expect(detector()).toBe(undefined)
	})
	test("return empty array if the url contains no locale", () => {
		const availableLanguages = new Set(["en"])
		const url = new URL("http://localhost:80/blue")
		const detector = initRootSlugDetector({ url, availableLanguages })
		expect(detector()).toBe(undefined)
	})
	test("return empty array if the url contains no known locale", () => {
		const availableLanguages = new Set(["de"])
		const url = new URL("http://localhost:80/en/blue")
		const detector = initRootSlugDetector({ url, availableLanguages })
		expect(detector()).toBe(undefined)
	})
	test("return empty array if the url contains no related locale", () => {
		const availableLanguages = new Set(["en"])
		const url = new URL("http://localhost:80/en-US/blue")
		const detector = initRootSlugDetector({ url, availableLanguages })
		expect(detector()).toBe(undefined)
	})
	test("return matching locale", () => {
		const langs = "en-US"
		const availableLanguages = new Set([langs])
		const url = new URL(`http://localhost:80/${langs}/blue`)
		const detector = initRootSlugDetector({ url, availableLanguages })
		expect(detector()).toBe(langs)
	})
})
