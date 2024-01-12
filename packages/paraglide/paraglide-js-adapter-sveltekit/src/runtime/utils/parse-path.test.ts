import { describe, it, expect } from "vitest"
import { parsePath } from "./parse-path"

describe("parsePath", () => {
	it("correctly identifies the segments (with base path)", () => {
		const { lang, base, canonicalPath } = parsePath("/base/de/foo/bar", {
			base: "/base",
			availableLanguageTags: ["en", "de"],
			defaultLanguageTag: "en",
		})

		expect(lang).toBe("de")
		expect(base).toBe("/base")
		expect(canonicalPath).toBe("/foo/bar")
	})

	it("correctly identifies the segments (without base path)", () => {
		const { lang, base, canonicalPath } = parsePath("/de/foo/bar", {
			base: "/",
			availableLanguageTags: ["en", "de"],
			defaultLanguageTag: "en",
		})

		expect(lang).toBe("de")
		expect(base).toBe("/")
		expect(canonicalPath).toBe("/foo/bar")
	})

	it("deals with empty inputs", () => {
		const { lang, base, canonicalPath } = parsePath("/", {
			base: "/",
			availableLanguageTags: ["en", "de"],
			defaultLanguageTag: "en",
		})

		expect(lang).toBe("en")
		expect(base).toBe("/")
		expect(canonicalPath).toBe("/")
	})

	it("deals with an input that is just the base inputs", () => {
		const { lang, base, canonicalPath } = parsePath("/base", {
			base: "/base",
			availableLanguageTags: ["en", "de"],
			defaultLanguageTag: "en",
		})

		expect(lang).toBe("en")
		expect(base).toBe("/base")
		expect(canonicalPath).toBe("/")
	})

	it("falls backt to the default language if no language segment is present", () => {
		const { lang } = parsePath("/base/path", {
			base: "/base",
			availableLanguageTags: ["de", "en", "fr"],
			defaultLanguageTag: "en",
		})
		expect(lang).toBe("en")
	})

	it("identifies data-requests as data requests", () => {
		const { isDataRequest } = parsePath("/foo/bar/__data.json", {
			base: "/",
			availableLanguageTags: ["en"],
			defaultLanguageTag: "en",
		})
		expect(isDataRequest).toBe(true)
	})

	it("doesn't identify non-data-requests as data requests", () => {
		const { isDataRequest } = parsePath("/foo/bar", {
			base: "/",
			availableLanguageTags: ["en"],
			defaultLanguageTag: "en",
		})
		expect(isDataRequest).toBe(false)
	})
})
