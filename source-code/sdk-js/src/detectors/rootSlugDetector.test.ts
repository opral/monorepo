import { describe, expect, test } from "vitest"
import type { Language } from "./sharedTypes.js"
import { rootSlugDetector } from "./rootSlugDetector.js"

describe("rootSlugDetector", () => {
	test("return empty array if availableLanguages is Empty", () => {
		const availableLanguages = new Set<Language>([])
		const url = new URL("http://localhost:80/en/blue")
		expect(rootSlugDetector({ url, availableLanguages })).toBe(undefined)
	})
	test("return empty array if the url contains no locale", () => {
		const availableLanguages = new Set<Language>(["en"])
		const url = new URL("http://localhost:80/blue")
		expect(rootSlugDetector({ url, availableLanguages })).toBe(undefined)
	})
	test("return empty array if the url contains no known locale", () => {
		const availableLanguages = new Set<Language>(["de"])
		const url = new URL("http://localhost:80/en/blue")
		expect(rootSlugDetector({ url, availableLanguages })).toBe(undefined)
	})
	test("return empty array if the url contains no related locale", () => {
		const availableLanguages = new Set<Language>(["en"])
		const url = new URL("http://localhost:80/en-US/blue")
		expect(rootSlugDetector({ url, availableLanguages })).toBe(undefined)
	})
	test("return matching locale", () => {
		const langs = "en-US"
		const availableLanguages = new Set<Language>([langs])
		const url = new URL(`http://localhost:80/${langs}/blue`)
		expect(rootSlugDetector({ url, availableLanguages })).toBe(langs)
	})
})
