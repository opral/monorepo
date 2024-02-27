import { it, expect, describe } from "vitest"
import { prefixStrategy, isExternal } from "./prefix"

const {
	getLocaleFromLocalisedPath,
	translatePath,
	getCanonicalPath,
	getLocalisedPath,
	localiseHref,
} = prefixStrategy<"en" | "de" | "de-CH">({
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
})

describe("getLocaleFromLocalisedPath", () => {
	it("returns the locale if there is one", () => {
		expect(getLocaleFromLocalisedPath("/de/some/path")).toBe("de")
		expect(getLocaleFromLocalisedPath("/en/some/path")).toBe("en")
		expect(getLocaleFromLocalisedPath("/de-CH/some/path")).toBe("de-CH")
	})

	it("returns the undefined if there is no locale", () => {
		expect(getLocaleFromLocalisedPath("/some/path")).toBe(undefined)
	})
})

describe("getCanonicalPath", () => {
	it("get's the canonical path for just the language prefix", () => {
		expect(getCanonicalPath("/de")).toBe("/")
		expect(getCanonicalPath("/en")).toBe("/")
		expect(getCanonicalPath("/")).toBe("/")
		expect(getCanonicalPath("/de-CH")).toBe("/")
	})

	it("removes the language prefix if there is one", () => {
		expect(getCanonicalPath("/de/some/path")).toBe("/some/path")
		expect(getCanonicalPath("/en/some/path")).toBe("/some/path")
		expect(getCanonicalPath("/de-CH/some/path")).toBe("/some/path")
	})

	it("returns the path if there is no language prefix", () => {
		expect(getCanonicalPath("/some/path")).toBe("/some/path")
	})

	it("get's the canonical path for translated paths", () => {
		expect(getCanonicalPath("/de/uebersetzt")).toBe("/canonical-translated")
		expect(getCanonicalPath("/en/translated")).toBe("/canonical-translated")
		expect(getCanonicalPath("/de-CH/uebersetzt")).toBe("/canonical-translated")
	})

	it("get's the canonical path for translated paths with params", () => {
		expect(getCanonicalPath("/de/uebersetzt/1")).toBe("/canonical-translated/1")
		expect(getCanonicalPath("/en/translated/1")).toBe("/canonical-translated/1")
		expect(getCanonicalPath("/de-CH/uebersetzt/1")).toBe("/canonical-translated/1")
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
		expect(translatePath("/some/path", "de")).toBe("/de/some/path")
		expect(translatePath("/some/path", "de-CH")).toBe("/de-CH/some/path")
	})

	it("replaces the language prefix if there is one", () => {
		expect(translatePath("/en/some/path", "de")).toBe("/de/some/path")
		expect(translatePath("/en/some/path", "de-CH")).toBe("/de-CH/some/path")

		// valid language tag, but not in availableLanguageTags
		expect(translatePath("/fr/some/path", "de")).toBe("/de/fr/some/path")
	})

	it("removes the language prefix if the new locale is the source language tag", () => {
		expect(translatePath("/en/some/path", "en")).toBe("/some/path")
		expect(translatePath("/de/some/path", "en")).toBe("/some/path")
		expect(translatePath("/de-CH/some/path", "en")).toBe("/some/path")
	})

	it("does not add a language prefix if the new locale is the source language tag", () => {
		expect(translatePath("/some/path", "en")).toBe("/some/path")
	})

	it("keeps search params and hash", () => {
		expect(translatePath("/some/path?foo=bar#hash", "de")).toBe("/de/some/path?foo=bar#hash")
		expect(translatePath("/some/path?foo=bar#hash", "de-CH")).toBe("/de-CH/some/path?foo=bar#hash")
		expect(translatePath("/some/path?foo=bar#hash", "en")).toBe("/some/path?foo=bar#hash")
	})

	it("leaves excluded paths alone", () => {
		expect(translatePath("/api/some/path", "de")).toBe("/api/some/path")
	})

	it("translates paths with path translations", () => {
		expect(translatePath("/de/uebersetzt", "en")).toBe("/translated")
		expect(translatePath("/translated", "de")).toBe("/de/uebersetzt")
		expect(translatePath("/de-CH/uebersetzt", "en")).toBe("/translated")
	})

	it("translates paths with path translations with params", () => {
		expect(translatePath("/de/uebersetzt/1", "en")).toBe("/translated/1")
		expect(translatePath("/translated/1", "de")).toBe("/de/uebersetzt/1")
		expect(translatePath("/de-CH/uebersetzt/1", "en")).toBe("/translated/1")
	})
})

describe("localiseHref", () => {
	it("translates absolute paths (string)", () => {
		expect(localiseHref("/some/path", "de")).toBe("/de/some/path")
		expect(localiseHref("/some/path", "de-CH")).toBe("/de-CH/some/path")
		expect(localiseHref("/some/path", "en")).toBe("/some/path")
	})

	it("translates absolute paths (object)", () => {
		expect(localiseHref({ pathname: "/some/path" }, "de")).toEqual({ pathname: "/de/some/path" })
		expect(localiseHref({ pathname: "/some/path" }, "de-CH")).toEqual({
			pathname: "/de-CH/some/path",
		})
		expect(localiseHref({ pathname: "/some/path" }, "en")).toEqual({ pathname: "/some/path" })
	})

	it("keeps search params and hash (string)", () => {
		expect(localiseHref("/some/path?foo=bar#hash", "de")).toBe("/de/some/path?foo=bar#hash")
		expect(localiseHref("/some/path?foo=bar#hash", "de-CH")).toBe("/de-CH/some/path?foo=bar#hash")
		expect(localiseHref("/some/path?foo=bar#hash", "en")).toBe("/some/path?foo=bar#hash")
	})

	it("keeps search params and hash (object)", () => {
		expect(
			localiseHref({ pathname: "/some/path", search: "?foo=bar", hash: "#hash" }, "de")
		).toEqual({
			pathname: "/de/some/path",
			search: "?foo=bar",
			hash: "#hash",
		})

		expect(
			localiseHref({ pathname: "/some/path", search: "?foo=bar", hash: "#hash" }, "de-CH")
		).toEqual({
			pathname: "/de-CH/some/path",
			search: "?foo=bar",
			hash: "#hash",
		})

		expect(
			localiseHref({ pathname: "/some/path", search: "?foo=bar", hash: "#hash" }, "en")
		).toEqual({
			pathname: "/some/path",
			search: "?foo=bar",
			hash: "#hash",
		})
	})

	it("does not translate relative paths (string)", () => {
		expect(localiseHref("some/path", "de")).toBe("some/path")
		expect(localiseHref("some/path", "de-CH")).toBe("some/path")
		expect(localiseHref("some/path", "en")).toBe("some/path")
	})

	it("does not translate relative paths (object)", () => {
		expect(localiseHref({ pathname: "some/path" }, "de")).toEqual({ pathname: "some/path" })
		expect(localiseHref({ pathname: "some/path" }, "de-CH")).toEqual({ pathname: "some/path" })
		expect(localiseHref({ pathname: "some/path" }, "en")).toEqual({ pathname: "some/path" })
	})

	it("does not translate external links (string)", () => {
		expect(localiseHref("https://some/path", "de-CH")).toBe("https://some/path")
		expect(localiseHref("https://some/path", "de")).toBe("https://some/path")
		expect(localiseHref("https://some/path", "en")).toBe("https://some/path")
	})

	it("does not translate external links (object)", () => {
		expect(localiseHref({ host: "some", pathname: "path" }, "de")).toEqual({
			host: "some",
			pathname: "path",
		})
		expect(localiseHref({ host: "some", pathname: "path" }, "de-CH")).toEqual({
			host: "some",
			pathname: "path",
		})
		expect(localiseHref({ host: "some", pathname: "path" }, "en")).toEqual({
			host: "some",
			pathname: "path",
		})
	})

	it("applies path translations", () => {
		expect(localiseHref("/canonical-translated", "de")).toBe("/de/uebersetzt")
		expect(localiseHref("/canonical-translated", "en")).toBe("/translated")
		expect(localiseHref("/canonical-translated", "de-CH")).toBe("/de-CH/uebersetzt")
	})

	it("applies path translations with search params and hash (string)", () => {
		expect(localiseHref("/canonical-translated?foo=bar#hash", "de")).toBe(
			"/de/uebersetzt?foo=bar#hash"
		)
		expect(localiseHref("/canonical-translated?foo=bar#hash", "de-CH")).toBe(
			"/de-CH/uebersetzt?foo=bar#hash"
		)
		expect(localiseHref("/canonical-translated?foo=bar#hash", "en")).toBe(
			"/translated?foo=bar#hash"
		)
	})
})

describe("isExternal", () => {
	it("returns true for external links", () => {
		expect(isExternal("mailto:hello@test.com")).toBe(true)
		expect(isExternal("https://example.com")).toBe(true)
		expect(isExternal("http://example.com")).toBe(true)
	})

	it("returns false for path-only links", () => {
		expect(isExternal("/some/path")).toBe(false)
		expect(isExternal("some/path")).toBe(false)
	})
})