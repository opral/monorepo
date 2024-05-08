import { describe, it, expect } from "vitest"
import { createLocaliseHref, isExternal } from "./localiseHref"
import { PrefixStrategy } from "./routing-strategy/strats/prefixStrategy"

const strategy = PrefixStrategy<"en" | "de" | "de-CH">({
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
	prefixDefault: "never",
	exclude: (path) => path.startsWith("/api/"),
})

const localiseHref = createLocaliseHref(strategy)

describe("localiseHref", () => {
	it("translates absolute paths (string)", () => {
		expect(localiseHref("/some/path", "de", "/", false)).toBe("/de/some/path")
		expect(localiseHref("/some/path", "de-CH", "/", false)).toBe("/de-CH/some/path")
		expect(localiseHref("/some/path", "en", "/", false)).toBe("/some/path")
	})

	it("translates absolute paths (object)", () => {
		expect(localiseHref({ pathname: "/some/path" }, "de", "/", false)).toEqual({
			pathname: "/de/some/path",
		})
		expect(localiseHref({ pathname: "/some/path" }, "de-CH", "/", false)).toEqual({
			pathname: "/de-CH/some/path",
		})
		expect(localiseHref({ pathname: "/some/path" }, "en", "/", false)).toEqual({
			pathname: "/some/path",
		})
	})

	it("keeps search params and hash (string)", () => {
		expect(localiseHref("/some/path?foo=bar#hash", "de", "/", false)).toBe(
			"/de/some/path?foo=bar#hash"
		)
		expect(localiseHref("/some/path?foo=bar#hash", "de-CH", "/", false)).toBe(
			"/de-CH/some/path?foo=bar#hash"
		)
		expect(localiseHref("/some/path?foo=bar#hash", "en", "/somewhere", false)).toBe(
			"/some/path?foo=bar#hash"
		)
	})

	it("keeps search params and hash (object)", () => {
		expect(
			localiseHref(
				{ pathname: "/some/path", search: "?foo=bar", hash: "#hash" },
				"de",
				"/somewhere",
				false
			)
		).toEqual({
			pathname: "/de/some/path",
			search: "?foo=bar",
			hash: "#hash",
		})

		expect(
			localiseHref(
				{ pathname: "/some/path", search: "?foo=bar", hash: "#hash" },
				"de-CH",
				"/somewhere",
				false
			)
		).toEqual({
			pathname: "/de-CH/some/path",
			search: "?foo=bar",
			hash: "#hash",
		})

		expect(
			localiseHref(
				{ pathname: "/some/path", search: "?foo=bar", hash: "#hash" },
				"en",
				"/somewhere",
				false
			)
		).toEqual({
			pathname: "/some/path",
			search: "?foo=bar",
			hash: "#hash",
		})
	})

	it("does not translate relative paths (string)", () => {
		expect(localiseHref("some/path", "de", "/somewhere", false)).toBe("some/path")
		expect(localiseHref("some/path", "de-CH", "/somewhere", false)).toBe("some/path")
		expect(localiseHref("some/path", "en", "/somewhere", false)).toBe("some/path")
	})

	it("does translates relative paths (object)", () => {
		expect(localiseHref({ pathname: "some/path" }, "de", "/some-page/", false)).toEqual({
			pathname: "/de/some-page/some/path",
		})
		expect(localiseHref({ pathname: "some/path" }, "de-CH", "/", false)).toEqual({
			pathname: "/de-CH/some/path",
		})
		expect(localiseHref({ pathname: "some/path" }, "en", "/some-page", false)).toEqual({
			pathname: "/some/path",
		})
	})

	it("does not translate external links (string)", () => {
		expect(localiseHref("https://some/path", "de-CH", "/", false)).toBe("https://some/path")
		expect(localiseHref("https://some/path", "de", "/", false)).toBe("https://some/path")
		expect(localiseHref("https://some/path", "en", "/", false)).toBe("https://some/path")
	})

	it("does not translate external links (object)", () => {
		expect(localiseHref({ host: "some", pathname: "path" }, "de", "/", false)).toEqual({
			host: "some",
			pathname: "path",
		})
		expect(localiseHref({ host: "some", pathname: "path" }, "de-CH", "/", false)).toEqual({
			host: "some",
			pathname: "path",
		})
		expect(localiseHref({ host: "some", pathname: "path" }, "en", "/", false)).toEqual({
			host: "some",
			pathname: "path",
		})
	})

	it("applies path translations", () => {
		expect(localiseHref("/canonical-translated", "de", "/", false)).toBe("/de/uebersetzt")
		expect(localiseHref("/canonical-translated", "en", "/", false)).toBe("/translated")
		expect(localiseHref("/canonical-translated", "de-CH", "/", false)).toBe("/de-CH/uebersetzt")
	})

	it("applies path translations with search params and hash (string)", () => {
		expect(localiseHref("/canonical-translated?foo=bar#hash", "de", "/", false)).toBe(
			"/de/uebersetzt?foo=bar#hash"
		)
		expect(localiseHref("/canonical-translated?foo=bar#hash", "de-CH", "/", false)).toBe(
			"/de-CH/uebersetzt?foo=bar#hash"
		)
		expect(localiseHref("/canonical-translated?foo=bar#hash", "en", "/", false)).toBe(
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
