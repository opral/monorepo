import { describe, it, expect } from "vitest"
import { validatePathTranslations } from "./validatePathTranslations"

describe("validatePathTranslations", () => {
	it("validates path translations", () => {
		const pathTranslations = {
			"/about": {
				en: "/about",
				de: "/ueber-unss",
			},
		}
		// @ts-ignore
		const result = validatePathTranslations(pathTranslations)
		expect(result).toEqual([])
	})

	it("complains if the canonical path does not start with a slash", () => {
		const pathTranslations = {
			about: {
				en: "/about",
				de: "/ueber-unss",
			},
		}
		// @ts-ignore
		const result = validatePathTranslations(pathTranslations)
		expect(result.length).toBe(1)
	})

	it("complains if not all languages are translated", () => {
		const pathTranslations = {
			"/about": {
				en: "/about",
			},
		}
		// @ts-ignore
		const result = validatePathTranslations(pathTranslations)
		expect(result.length).toBe(1)
	})
})
