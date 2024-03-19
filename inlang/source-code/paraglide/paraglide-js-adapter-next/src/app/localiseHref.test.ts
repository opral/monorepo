import { describe, it, expect } from "vitest"
import { createLocaliseHref, isExternal } from "./localiseHref"
import { PrefixStrategy } from "./routing/prefixStrategy"

const strategy = PrefixStrategy<"en" | "de" | "de-CH">({
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
	prefix: "except-default",
	exclude: (path) => path.startsWith("/api/"),
})

const localiseHref = createLocaliseHref(strategy)

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
