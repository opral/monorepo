import { it, expect, describe } from "vitest"
import { DomainStrategy } from "./domainStrategy"
import { format } from "../utils/format"

const { getCanonicalPath, getLocalisedUrl } = DomainStrategy<"en" | "de" | "de-CH">({
	domains: {
		en: "example.com",
		de: "de.example.com",
		"de-CH": "example.ch",
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
