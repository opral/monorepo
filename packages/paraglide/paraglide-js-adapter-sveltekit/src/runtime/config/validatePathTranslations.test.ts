import { describe, it, expect } from "vitest"
import { validatePathTranslations } from "./validatePathTranslations"

describe("validatePathTranslations", () => {
	it("validates path translations", () => {
		const pathTranslations = {
			"/about": {
				en: "/about",
				de: "/ueber-uns",
			},
		}
		// @ts-ignore
		const result = validatePathTranslations(pathTranslations, ["en", "de"])
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
		const result = validatePathTranslations(pathTranslations, ["en", "de"])
		expect(result.length).toBe(1)
	})

	it("complains if not all languages are translated", () => {
		const pathTranslations = {
			"/about": {
				en: "/about",
			},
		}
		// @ts-ignore
		const result = validatePathTranslations(pathTranslations, ["en", "de"])
		expect(result.length).toBe(1)
	})

	it("complains if not all variants have the same parameters", () => {
		const pathTranslations = {
			"/about/[id]": {
				en: "/about/[id]",
				de: "/ueber-uns/[notId]",
			},
		}
		// @ts-ignore
		const result = validatePathTranslations(pathTranslations, ["en", "de"])
		expect(result.length).toBe(1)
	})

	it("complains if a variant has extra parameters", () => {
		const pathTranslations = {
			"/about": {
				en: "/about",
				de: "/ueber-uns/[extra]",
			},
		}
		// @ts-ignore
		const result = validatePathTranslations(pathTranslations, ["en", "de"])
		expect(result.length).toBe(1)
	})

	it("doesn't complain if all variants have the same parameters", () => {
		const pathTranslations = {
			"/about/[id]": {
				en: "/about/[id]",
				de: "/ueber-uns/[id]",
			},
		}
		// @ts-ignore
		const result = validatePathTranslations(pathTranslations, ["en", "de"])
		expect(result.length).toBe(0)
	})
})
