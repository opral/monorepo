import { it, expect, describe } from "vitest"
import { PrefixStrategy } from "./prefixStrategy"
import { NextRequest } from "next/server"

const { resolveLanguage, translatePath, getCanonicalPath, getLocalisedPath } = PrefixStrategy({
	availableLanguageTags: ["en", "de", "de-CH"],
	defaultLanguage: "en",
	pathnames: {
		"/canonical-translated": {
			de: "/uebersetzt",
			"de-CH": "/uebersetzt",
			en: "/translated",
		},
		"/canonical-translated/[id]": {
			de: "/uebersetzt/[id]",
			"de-CH": "/uebersetzt/[id]",
			en: "/translated/[id]",
		},
	},
	exclude: (path) => path.startsWith("/api/"),
	prefix: "except-default",
})

describe("resolveLanguage", () => {
	it("returns the locale if there is one", () => {
		expect(resolveLanguage(new NextRequest("https://example.com/de/some/path"))).toBe("de")
		expect(resolveLanguage(new NextRequest("https://example.com/en/some/path"))).toBe("en")
		expect(resolveLanguage(new NextRequest("https://example.com/de-CH/some/path"))).toBe("de-CH")
	})

	it("returns the default language if there is no locale", () => {
		expect(resolveLanguage(new NextRequest("https://example.com/some/path"))).toBe("en")
	})
})

describe("getCanonicalPath", () => {
	it("get's the canonical path for just the language prefix", () => {
		expect(getCanonicalPath("/de", "de")).toBe("/")
		expect(getCanonicalPath("/en", "en")).toBe("/")
		expect(getCanonicalPath("/", "en")).toBe("/")
		expect(getCanonicalPath("/de-CH", "de-CH")).toBe("/")
	})

	it("removes the language prefix if there is one", () => {
		expect(getCanonicalPath("/de/some/path", "de")).toBe("/some/path")
		expect(getCanonicalPath("/en/some/path", "en")).toBe("/some/path")
		expect(getCanonicalPath("/de-CH/some/path", "de-CH")).toBe("/some/path")
	})

	it("returns the path if there is no language prefix", () => {
		expect(getCanonicalPath("/some/path", "en")).toBe("/some/path")
	})

	it("get's the canonical path for translated paths", () => {
		expect(getCanonicalPath("/de/uebersetzt", "de")).toBe("/canonical-translated")
		expect(getCanonicalPath("/en/translated", "en")).toBe("/canonical-translated")
		expect(getCanonicalPath("/de-CH/uebersetzt", "de-CH")).toBe("/canonical-translated")
	})

	it("get's the canonical path for translated paths with params", () => {
		expect(getCanonicalPath("/de/uebersetzt/1", "de")).toBe("/canonical-translated/1")
		expect(getCanonicalPath("/en/translated/1", "en")).toBe("/canonical-translated/1")
		expect(getCanonicalPath("/de-CH/uebersetzt/1", "de-CH")).toBe("/canonical-translated/1")
	})
})

describe("getLocalisedPath", () => {
	it("adds a language prefix if there isn't one", () => {
		expect(getLocalisedPath("/", "de")).toBe("/de")
		expect(getLocalisedPath("/", "de-CH")).toBe("/de-CH")
		expect(getLocalisedPath("/", "en")).toBe("/")
		expect(getLocalisedPath("/some/path", "de")).toBe("/de/some/path")
		expect(getLocalisedPath("/some/path", "de-CH")).toBe("/de-CH/some/path")
	})

	it("does not add a language prefix if the new locale is the source language tag", () => {
		expect(getLocalisedPath("/some/path", "en")).toBe("/some/path")
	})

	it("does not localise excluded paths", () => {
		expect(getLocalisedPath("/api/some/path", "de")).toBe("/api/some/path")
	})

	it("get's translated paths", () => {
		expect(getLocalisedPath("/canonical-translated", "de")).toBe("/de/uebersetzt")
		expect(getLocalisedPath("/canonical-translated", "en")).toBe("/translated")
		expect(getLocalisedPath("/canonical-translated", "de-CH")).toBe("/de-CH/uebersetzt")
	})

	it("get's translated paths with params", () => {
		expect(getLocalisedPath("/canonical-translated/1", "de")).toBe("/de/uebersetzt/1")
		expect(getLocalisedPath("/canonical-translated/1", "en")).toBe("/translated/1")
		expect(getLocalisedPath("/canonical-translated/1", "de-CH")).toBe("/de-CH/uebersetzt/1")
	})
})

describe("translatePath", () => {
	it("adds a language prefix if there isn't one", () => {
		expect(translatePath("/some/path", "en", "de")).toBe("/de/some/path")
		expect(translatePath("/some/path", "en", "de-CH")).toBe("/de-CH/some/path")
	})

	it("replaces the language prefix if there is one", () => {
		expect(translatePath("/en/some/path", "en", "de")).toBe("/de/some/path")
		expect(translatePath("/en/some/path", "en", "de-CH")).toBe("/de-CH/some/path")
	})

	it("removes the language prefix if the new locale is the default language tag", () => {
		expect(translatePath("/en/some/path", "en", "en")).toBe("/some/path")
		expect(translatePath("/de/some/path", "de", "en")).toBe("/some/path")
		expect(translatePath("/de-CH/some/path", "de-CH", "en")).toBe("/some/path")
	})

	it("does not add a language prefix if the new locale is the default language tag", () => {
		expect(translatePath("/some/path", "en", "en")).toBe("/some/path")
	})

	it("keeps search params and hash", () => {
		expect(translatePath("/some/path?foo=bar#hash", "en", "de")).toBe("/de/some/path?foo=bar#hash")
		expect(translatePath("/some/path?foo=bar#hash", "en", "de-CH")).toBe(
			"/de-CH/some/path?foo=bar#hash"
		)
		expect(translatePath("/some/path?foo=bar#hash", "en", "en")).toBe("/some/path?foo=bar#hash")
	})

	it("leaves excluded paths alone", () => {
		expect(translatePath("/api/some/path", "en", "de")).toBe("/api/some/path")
	})

	it("translates paths with path translations", () => {
		expect(translatePath("/de/uebersetzt", "de", "en")).toBe("/translated")
		expect(translatePath("/translated", "en", "de")).toBe("/de/uebersetzt")
		expect(translatePath("/de-CH/uebersetzt", "de-CH", "en")).toBe("/translated")
	})

	it("translates paths with path translations with params", () => {
		expect(translatePath("/de/uebersetzt/1", "de", "en")).toBe("/translated/1")
		expect(translatePath("/translated/1", "en", "de")).toBe("/de/uebersetzt/1")
		expect(translatePath("/de-CH/uebersetzt/1", "de-CH", "en")).toBe("/translated/1")
	})
})
