import { describe, it, expect } from "vitest"
import { getPathInfo } from "./get-path-info"

describe("parsePath", () => {
	it("correctly identifies the segments (with base path)", () => {
		const {
			lang,
			normalizedBase: base,
			path: canonicalPath,
			trailingSlash,
		} = getPathInfo("/base/de/foo/bar", {
			normalizedBase: "/base",
			availableLanguageTags: ["en", "de"],
			defaultLanguageTag: "en",
		})

		expect(lang).toBe("de")
		expect(base).toBe("/base")
		expect(canonicalPath).toBe("/foo/bar")
		expect(trailingSlash).toBe(false)
	})

	it("correctly identifies the segments (without base path)", () => {
		const {
			lang,
			path: canonicalPath,
			trailingSlash,
		} = getPathInfo("/de/foo/bar", {
			normalizedBase: "",
			availableLanguageTags: ["en", "de"],
			defaultLanguageTag: "en",
		})

		expect(lang).toBe("de")
		expect(canonicalPath).toBe("/foo/bar")
		expect(trailingSlash).toBe(false)
	})

	it("deals with empty inputs", () => {
		const {
			lang,
			path: canonicalPath,
			trailingSlash,
		} = getPathInfo("/", {
			normalizedBase: "/",
			availableLanguageTags: ["en", "de"],
			defaultLanguageTag: "en",
		})

		expect(lang).toBe("en")
		expect(canonicalPath).toBe("/")
		expect(trailingSlash).toBe(false)
	})

	it("deals with an input that is just the base inputs", () => {
		const {
			lang,
			normalizedBase: base,
			path: canonicalPath,
			trailingSlash,
		} = getPathInfo("/base", {
			normalizedBase: "/base",
			availableLanguageTags: ["en", "de"],
			defaultLanguageTag: "en",
		})

		expect(lang).toBe("en")
		expect(base).toBe("/base")
		expect(canonicalPath).toBe("/")
		expect(trailingSlash).toBe(false)
	})

	it("falls backt to the default language if no language segment is present", () => {
		const { lang } = getPathInfo("/base/path", {
			normalizedBase: "/base",
			availableLanguageTags: ["de", "en", "fr"],
			defaultLanguageTag: "en",
		})
		expect(lang).toBe("en")
	})

	it("identifies data-requests as data requests", () => {
		const { dataSuffix } = getPathInfo("/foo/bar/__data.json", {
			normalizedBase: "/",
			availableLanguageTags: ["en"],
			defaultLanguageTag: "en",
		})
		expect(dataSuffix).toBe("__data.json")
	})

	it("identifies data-requests as html data requests", () => {
		const { dataSuffix, path } = getPathInfo("/foo/bar/.html__data.json", {
			normalizedBase: "/",
			availableLanguageTags: ["en"],
			defaultLanguageTag: "en",
		})
		expect(dataSuffix).toBe(".html__data.json")
		expect(path).toBe("/foo/bar")
	})

	it("doesn't identify non-data-requests as data requests", () => {
		const { dataSuffix, path } = getPathInfo("/foo/bar", {
			normalizedBase: "/",
			availableLanguageTags: ["en"],
			defaultLanguageTag: "en",
		})
		expect(dataSuffix).toBeUndefined()
		expect(path).toBe("/foo/bar")
	})

	it("returns the correct trailing slash", () => {
		const { trailingSlash } = getPathInfo("/foo/bar/", {
			normalizedBase: "/",
			availableLanguageTags: ["en"],
			defaultLanguageTag: "en",
		})

		expect(trailingSlash).toBe(true)
	})
})
