import { it, expect, describe } from "vitest"
import { PrefixStrategy } from "./prefixStrategy"
import { NextRequest } from "next/server"

const { resolveLanguage, getCanonicalPath, getLocalisedPath } = PrefixStrategy({
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
		expect(getLocalisedPath("/", "de", { isLocaleSwitch: false })).toBe("/de")
		expect(getLocalisedPath("/", "de-CH", { isLocaleSwitch: false })).toBe("/de-CH")
		expect(getLocalisedPath("/", "en", { isLocaleSwitch: false })).toBe("/")
		expect(getLocalisedPath("/some/path", "de", { isLocaleSwitch: false })).toBe("/de/some/path")
		expect(getLocalisedPath("/some/path", "de-CH", { isLocaleSwitch: false })).toBe(
			"/de-CH/some/path"
		)
	})

	it("does not add a language prefix if the new locale is the source language tag", () => {
		expect(getLocalisedPath("/some/path", "en", { isLocaleSwitch: false })).toBe("/some/path")
	})

	it("does not localise excluded paths", () => {
		expect(getLocalisedPath("/api/some/path", "de", { isLocaleSwitch: false })).toBe(
			"/api/some/path"
		)
	})

	it("get's translated paths", () => {
		expect(getLocalisedPath("/canonical-translated", "de", { isLocaleSwitch: false })).toBe(
			"/de/uebersetzt"
		)
		expect(getLocalisedPath("/canonical-translated", "en", { isLocaleSwitch: false })).toBe(
			"/translated"
		)
		expect(getLocalisedPath("/canonical-translated", "de-CH", { isLocaleSwitch: false })).toBe(
			"/de-CH/uebersetzt"
		)
	})

	it("get's translated paths with params", () => {
		expect(getLocalisedPath("/canonical-translated/1", "de", { isLocaleSwitch: false })).toBe(
			"/de/uebersetzt/1"
		)
		expect(getLocalisedPath("/canonical-translated/1", "en", { isLocaleSwitch: false })).toBe(
			"/translated/1"
		)
		expect(getLocalisedPath("/canonical-translated/1", "de-CH", { isLocaleSwitch: false })).toBe(
			"/de-CH/uebersetzt/1"
		)
	})
})
