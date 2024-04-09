import { describe, it, expect } from "vitest"
import { translatePath } from "./translatePath"

describe("translatePath", () => {
	it("translates from the default language (no base path)", () => {
		const translatedPath = translatePath(
			"/foo/bar",
			"de",
			{},
			{},
			{
				base: "/",
				availableLanguageTags: ["de", "en"],
				defaultLanguageTag: "en",
				prefixDefaultLanguage: "never",
			}
		)

		expect(translatedPath).toBe("/de/foo/bar")
	})

	it("translates a path from the default language (with base)", () => {
		const translatedPath = translatePath(
			"/base/foo/bar",
			"de",
			{},
			{},
			{
				base: "/base",
				availableLanguageTags: ["de", "en"],
				defaultLanguageTag: "en",
				prefixDefaultLanguage: "never",
			}
		)

		expect(translatedPath).toBe("/base/de/foo/bar")
	})

	it("keeps the trailing slash if present (with base)", () => {
		const translatedPath = translatePath(
			"/base/foo/bar/",
			"de",
			{},
			{},
			{
				base: "/base",
				availableLanguageTags: ["de", "en"],
				defaultLanguageTag: "en",
				prefixDefaultLanguage: "never",
			}
		)

		expect(translatedPath).toBe("/base/de/foo/bar/")
	})

	it("doesn't add a trailing slash if not present (with base)", () => {
		const translatedPath = translatePath(
			"/base/foo/bar",
			"de",
			{},
			{},
			{
				base: "/base",
				availableLanguageTags: ["de", "en"],
				defaultLanguageTag: "en",
				prefixDefaultLanguage: "never",
			}
		)

		expect(translatedPath).toBe("/base/de/foo/bar")
	})
})
