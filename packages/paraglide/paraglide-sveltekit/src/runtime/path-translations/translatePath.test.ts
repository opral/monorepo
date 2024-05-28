import { describe, it, expect } from "vitest"
import { translatePath } from "./translatePath"
import { base } from "$app/paths"

describe("translatePath", () => {
	it("translates from the default language", () => {
		const translatedPath = translatePath(
			base + "/foo/bar",
			"de",
			{},
			{},
			{
				normalizedBase: base,
				availableLanguageTags: ["de", "en"],
				defaultLanguageTag: "en",
				prefixDefaultLanguage: "never",
			}
		)

		expect(translatedPath).toBe(base + "/de/foo/bar")
	})

	it("keeps the trailing slash if present", () => {
		const translatedPath = translatePath(
			base + "/foo/bar/",
			"de",
			{},
			{},
			{
				normalizedBase: base,
				availableLanguageTags: ["de", "en"],
				defaultLanguageTag: "en",
				prefixDefaultLanguage: "never",
			}
		)

		expect(translatedPath).toBe(base + "/de/foo/bar/")
	})

	it("doesn't add a trailing slash if not present", () => {
		const translatedPath = translatePath(
			base + "/foo/bar",
			"de",
			{},
			{},
			{
				normalizedBase: base,
				availableLanguageTags: ["de", "en"],
				defaultLanguageTag: "en",
				prefixDefaultLanguage: "never",
			}
		)

		expect(translatedPath).toBe(base + "/de/foo/bar")
	})

	it("removes the language prefix with trailing slash", () => {
		const translatedPath = translatePath(
			"/de/",
			"en",
			{},
			{},
			{
				normalizedBase: base,
				availableLanguageTags: ["de", "en"],
				defaultLanguageTag: "en",
				prefixDefaultLanguage: "never",
			}
		)

		expect(translatedPath).toBe(base ? base + "/" : "/")
	})
})
