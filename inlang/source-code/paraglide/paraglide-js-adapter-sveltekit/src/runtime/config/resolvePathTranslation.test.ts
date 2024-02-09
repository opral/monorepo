import { describe, it, expect } from "vitest"
import { resolvePathTranslations } from "./resolvePathTranslations"
import { UserPathTranslations } from "./pathTranslations"

describe("resolvePathTranslations", () => {
	it("leaves object translations as is", () => {
		const userTranslations: UserPathTranslations<"en" | "de"> = {
			"/about": {
				en: "/about",
				de: "/ueber-uns",
			},
		}
		const availableLanguageTags = ["en", "de"] as const
		const result = resolvePathTranslations(userTranslations, availableLanguageTags)
		expect(result).toEqual(userTranslations)
	})

	it("resolves message translations", () => {
		const userTranslations: UserPathTranslations<"en" | "de"> = {
			"/about": (_, { languageTag }) => {
				switch (languageTag) {
					case "en":
						return "/about"
					case "de":
						return "/ueber-uns"
				}
			},
		}

		const availableLanguageTags = ["en", "de"] as const
		const result = resolvePathTranslations(userTranslations, availableLanguageTags)
		expect(result).toEqual({
			"/about": {
				en: "/about",
				de: "/ueber-uns",
			},
		})
	})
})
