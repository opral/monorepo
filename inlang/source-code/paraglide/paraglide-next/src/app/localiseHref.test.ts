import { describe, it, expect } from "vitest"
import { localizeHref, isExternal } from "./localiseHref"
import { PrefixStrategy } from "./routing-strategy/strats/prefixStrategy"
import { parse } from "node:url"

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

describe("localiseHref", () => {
	it("translates absolute paths (string)", () => {
		expect(localizeHref(strategy, "/some/path", "de", "/", false)).toBe("/de/some/path")
		expect(localizeHref(strategy, "/some/path", "de-CH", "/", false)).toBe("/de-CH/some/path")
		expect(localizeHref(strategy, "/some/path", "en", "/", false)).toBe("/some/path")
	})

	it("translates absolute paths (object)", () => {
		expect(localizeHref(strategy, { pathname: "/some/path" }, "de", "/", false)).toEqual({
			pathname: "/de/some/path",
		})
		expect(localizeHref(strategy, { pathname: "/some/path" }, "de-CH", "/", false)).toEqual({
			pathname: "/de-CH/some/path",
		})
		expect(localizeHref(strategy, { pathname: "/some/path" }, "en", "/", false)).toEqual({
			pathname: "/some/path",
		})
	})

	it("keeps search params and hash (string)", () => {
		expect(localizeHref(strategy, "/some/path?foo=bar#hash", "de", "/", false)).toBe(
			"/de/some/path?foo=bar#hash"
		)
		expect(localizeHref(strategy, "/some/path?foo=bar#hash", "de-CH", "/", false)).toBe(
			"/de-CH/some/path?foo=bar#hash"
		)
		expect(localizeHref(strategy, "/some/path?foo=bar#hash", "en", "/somewhere", false)).toBe(
			"/some/path?foo=bar#hash"
		)
	})

	it("keeps search params and hash (object)", () => {
		expect(
			localizeHref(
				strategy,
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
			localizeHref(
				strategy,
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
			localizeHref(
				strategy,
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
		expect(localizeHref(strategy, "some/path", "de", "/somewhere", false)).toBe("some/path")
		expect(localizeHref(strategy, "some/path", "de-CH", "/somewhere", false)).toBe("some/path")
		expect(localizeHref(strategy, "some/path", "en", "/somewhere", false)).toBe("some/path")
	})

	it("does translates relative paths (object)", () => {
		expect(localizeHref(strategy, { pathname: "some/path" }, "de", "/some-page/", false)).toEqual({
			pathname: "/de/some-page/some/path",
		})
		expect(localizeHref(strategy, { pathname: "some/path" }, "de-CH", "/", false)).toEqual({
			pathname: "/de-CH/some/path",
		})
		expect(localizeHref(strategy, { pathname: "some/path" }, "en", "/some-page", false)).toEqual({
			pathname: "/some/path",
		})
	})

	it("does not translate external links (string)", () => {
		expect(localizeHref(strategy, "https://some/path", "de-CH", "/", false)).toBe(
			"https://some/path"
		)
		expect(localizeHref(strategy, "https://some/path", "de", "/", false)).toBe("https://some/path")
		expect(localizeHref(strategy, "https://some/path", "en", "/", false)).toBe("https://some/path")
	})

	it("does not translate external links (object)", () => {
		expect(localizeHref(strategy, { host: "some", pathname: "path" }, "de", "/", false)).toEqual({
			host: "some",
			pathname: "path",
		})
		expect(localizeHref(strategy, { host: "some", pathname: "path" }, "de-CH", "/", false)).toEqual(
			{
				host: "some",
				pathname: "path",
			}
		)
		expect(localizeHref(strategy, { host: "some", pathname: "path" }, "en", "/", false)).toEqual({
			host: "some",
			pathname: "path",
		})
	})

	it("applies path translations", () => {
		expect(localizeHref(strategy, "/canonical-translated", "de", "/", false)).toBe("/de/uebersetzt")
		expect(localizeHref(strategy, "/canonical-translated", "en", "/", false)).toBe("/translated")
		expect(localizeHref(strategy, "/canonical-translated", "de-CH", "/", false)).toBe(
			"/de-CH/uebersetzt"
		)
	})

	it("applies path translations with search params and hash (string)", () => {
		expect(localizeHref(strategy, "/canonical-translated?foo=bar#hash", "de", "/", false)).toBe(
			"/de/uebersetzt?foo=bar#hash"
		)
		expect(localizeHref(strategy, "/canonical-translated?foo=bar#hash", "de-CH", "/", false)).toBe(
			"/de-CH/uebersetzt?foo=bar#hash"
		)
		expect(localizeHref(strategy, "/canonical-translated?foo=bar#hash", "en", "/", false)).toBe(
			"/translated?foo=bar#hash"
		)
	})
})

// the vitest setup doesn't provide the parse-function during production so the test fails
describe.skipIf(() => process.env.NODE_ENV !== "development")("isExternal", () => {
	it.each(["mailto:hello@test.com", "https://example.com", "http://example.com"])(
		"returns true for external links",
		(link) => {
			expect(isExternal(link)).toBe(true)
			expect(isExternal(parse(link))).toBe(true)
		}
	)

	it.each(["/some/path", "some/path", "#hash", "?foo=bar"])(
		"returns false for internal links",
		(link) => {
			expect(isExternal(link)).toBe(false)
			expect(isExternal(parse(link))).toBe(false)
		}
	)
})
