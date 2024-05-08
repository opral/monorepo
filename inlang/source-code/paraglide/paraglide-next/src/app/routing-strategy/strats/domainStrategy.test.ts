import { it, expect, describe } from "vitest"
import { DomainStrategy } from "./domainStrategy"
import { format } from "../../utils/format"
import { NextRequest } from "next/server"

const { getCanonicalPath, getLocalisedUrl, resolveLocale } = DomainStrategy<"en" | "de" | "de-CH">({
	domains: {
		en: "https://example.com",
		de: "https://de.example.com",
		"de-CH": "https://example.ch",
	},
})

describe("getCanonicalPath", () => {
	it("returns the path as-is", () => {
		expect(getCanonicalPath("/some-page", "de")).toBe("/some-page")
		expect(getCanonicalPath("/some-page", "de-CH")).toBe("/some-page")
		expect(getCanonicalPath("/some-page", "en")).toBe("/some-page")
	})
})

describe("getLocalisedUrl", () => {
	it("retuns the path as-is if it's not a language switch", () => {
		expect(getLocalisedUrl("/some/path", "de", false)).toEqual({ pathname: "/some/path" })
		expect(getLocalisedUrl("/some/path", "de-CH", false)).toEqual({ pathname: "/some/path" })
	})

	it("returns a full url if it is a language switch", () => {
		expect(format(getLocalisedUrl("/some/path", "de", true))).toEqual(
			"https://de.example.com/some/path"
		)
		expect(format(getLocalisedUrl("/some/path", "de-CH", true))).toEqual(
			"https://example.ch/some/path"
		)
	})
})

describe("resolveLocale", () => {
	it("resolves the locale based on the domain", () => {
		const request_en = new NextRequest("https://example.com/some-page")
		const request_de = new NextRequest("https://de.example.com/some-page")
		const request_de_ch = new NextRequest("https://example.ch/some-page")
		expect(resolveLocale(request_en)).toBe("en")
		expect(resolveLocale(request_de)).toBe("de")
		expect(resolveLocale(request_de_ch)).toBe("de-CH")
	})
})
