import { it, expect, describe } from "vitest"
import { prefixStrategy } from "./utils"

const { getLocaleFromPath, translatePath, translateHref } = prefixStrategy(
	["en", "de", "de-CH"],
	"en"
)

describe("getLocaleFromPath", () => {
	it("returns the locale if there is one", () => {
		expect(getLocaleFromPath("/de/some/path")).toBe("de")
		expect(getLocaleFromPath("/en/some/path")).toBe("en")
		expect(getLocaleFromPath("/de-CH/some/path")).toBe("de-CH")
	})

	it("returns the undefined if there is no locale", () => {
		expect(getLocaleFromPath("/some/path")).toBe(undefined)
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

	it("returns an empty string if the path is empty", () => {
		expect(translatePath("", "en")).toBe("")
	})

	it("keeps search params and hash", () => {
		expect(translatePath("/some/path?foo=bar#hash", "de")).toBe("/de/some/path?foo=bar#hash")
		expect(translatePath("/some/path?foo=bar#hash", "de-CH")).toBe("/de-CH/some/path?foo=bar#hash")
		expect(translatePath("/some/path?foo=bar#hash", "en")).toBe("/some/path?foo=bar#hash")
	})
})

describe("translateHref", () => {
	it("translates absolute paths (string)", () => {
		expect(translateHref("/some/path", "de")).toBe("/de/some/path")
		expect(translateHref("/some/path", "de-CH")).toBe("/de-CH/some/path")
		expect(translateHref("/some/path", "en")).toBe("/some/path")
	})

	it("translates absolute paths (object)", () => {
		expect(translateHref({ pathname: "/some/path" }, "de")).toEqual({ pathname: "/de/some/path" })
		expect(translateHref({ pathname: "/some/path" }, "de-CH")).toEqual({
			pathname: "/de-CH/some/path",
		})
		expect(translateHref({ pathname: "/some/path" }, "en")).toEqual({ pathname: "/some/path" })
	})

	it("keeps search params and hash (string)", () => {
		expect(translateHref("/some/path?foo=bar#hash", "de")).toBe("/de/some/path?foo=bar#hash")
		expect(translateHref("/some/path?foo=bar#hash", "de-CH")).toBe("/de-CH/some/path?foo=bar#hash")
		expect(translateHref("/some/path?foo=bar#hash", "en")).toBe("/some/path?foo=bar#hash")
	})

	it("keeps search params and hash (object)", () => {
		expect(
			translateHref({ pathname: "/some/path", search: "?foo=bar", hash: "#hash" }, "de")
		).toEqual({
			pathname: "/de/some/path",
			search: "?foo=bar",
			hash: "#hash",
		})

		expect(
			translateHref({ pathname: "/some/path", search: "?foo=bar", hash: "#hash" }, "de-CH")
		).toEqual({
			pathname: "/de-CH/some/path",
			search: "?foo=bar",
			hash: "#hash",
		})

		expect(
			translateHref({ pathname: "/some/path", search: "?foo=bar", hash: "#hash" }, "en")
		).toEqual({
			pathname: "/some/path",
			search: "?foo=bar",
			hash: "#hash",
		})
	})

	it("does not translate relative paths (string)", () => {
		expect(translateHref("some/path", "de")).toBe("some/path")
		expect(translateHref("some/path", "de-CH")).toBe("some/path")
		expect(translateHref("some/path", "en")).toBe("some/path")
	})

	it("does not translate relative paths (object)", () => {
		expect(translateHref({ pathname: "some/path" }, "de")).toEqual({ pathname: "some/path" })
		expect(translateHref({ pathname: "some/path" }, "de-CH")).toEqual({ pathname: "some/path" })
		expect(translateHref({ pathname: "some/path" }, "en")).toEqual({ pathname: "some/path" })
	})

	it("does not translate external links (string)", () => {
		expect(translateHref("https://some/path", "de")).toBe("https://some/path")
		expect(translateHref("https://some/path", "de-CH")).toBe("https://some/path")
		expect(translateHref("https://some/path", "en")).toBe("https://some/path")
	})

	it("does not translate external links (object)", () => {
		expect(translateHref({ host: "some", pathname: "path" }, "de")).toEqual({
			host: "some",
			pathname: "path",
		})
		expect(translateHref({ host: "some", pathname: "path" }, "de-CH")).toEqual({
			host: "some",
			pathname: "path",
		})
		expect(translateHref({ host: "some", pathname: "path" }, "en")).toEqual({
			host: "some",
			pathname: "path",
		})
	})
})
