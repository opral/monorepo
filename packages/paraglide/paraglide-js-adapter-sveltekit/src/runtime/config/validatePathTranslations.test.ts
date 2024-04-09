import { describe, it, expect } from "vitest"
import { validatePathTranslations } from "./validatePathTranslations"

describe("validatePathTranslations", () => {
	it("validates path translations", () => {
		const result = validatePathTranslations(
			{
				"/about": {
					en: "/about",
					de: "/ueber-uns",
				},
			},
			["en", "de"],
			{}
		)
		expect(result).toEqual([])
	})

	it("complains if the canonical path does not start with a slash", () => {
		const result = validatePathTranslations(
			{
				// @ts-expect-error - Doesn't start with a slash
				about: {
					en: "/about",
					de: "/ueber-unss",
				},
			},
			["en", "de"],
			{}
		)
		expect(result.length).toBe(1)
	})

	it("complains if not all languages are translated", () => {
		const result = validatePathTranslations(
			{
				// @ts-expect-error - Missing language
				"/about": {
					en: "/about",
				},
			},
			["en", "de"],
			{}
		)
		expect(result.length).toBe(1)
	})

	it("complains if not all variants have the same parameters", () => {
		const result = validatePathTranslations(
			{
				"/about/[id]": {
					en: "/about/[id]",
					de: "/ueber-uns/[notId]",
				},
			},
			["en", "de"],
			{}
		)
		expect(result.length).toBe(1)
	})

	it("complains if a variant has extra parameters", () => {
		const result = validatePathTranslations(
			{
				"/about": {
					en: "/about",
					de: "/ueber-uns/[extra]",
				},
			},
			["en", "de"],
			{}
		)
		expect(result.length).toBe(1)
	})

	it("doesn't complain if all variants have the same parameters", () => {
		const result = validatePathTranslations(
			{
				"/about/[id]": {
					en: "/about/[id]",
					de: "/ueber-uns/[id]",
				},
			},
			["en", "de"],
			{}
		)
		expect(result.length).toBe(0)
	})

	it("doesn't complain if there are extra languages", () => {
		const result = validatePathTranslations(
			{
				"/about": {
					en: "/about",
					de: "/ueber-uns",

					// @ts-expect-error - Extra language
					es: "/acerca-de",
				},
			},
			["en", "de"],
			{}
		)
		expect(result.length).toBe(0)
	})

	it("complains if the params aren't of the same type", () => {
		const result = validatePathTranslations(
			{
				"/about/[...slug]": {
					en: "/about/[...slug]",
					de: "/ueber-uns/[slug]",
				},
			},
			["en", "de"],
			{}
		)
		expect(result.length).toBe(1)
	})

	it("doesn't complain if the params are complex and of the same type", () => {
		const result = validatePathTranslations(
			{
				"/about/[...slug]": {
					en: "/about/[...slug]",
					de: "/ueber-uns/[...slug]",
				},
			},
			["en", "de"],
			{}
		)
		expect(result.length).toBe(0)
	})

	it("complains if the params use different matchers", () => {
		const result = validatePathTranslations(
			{
				"/about/[slug=int]": {
					en: "/about/[slug=int]",
					de: "/ueber-uns/[slug=float]",
				},
			},
			["en", "de"],
			{
				int: () => true,
				float: () => true,
			}
		)
		expect(result.length).toBe(1)
	})

	it("complains if a matchers is missing", () => {
		const result = validatePathTranslations(
			{
				"/about/[slug=int]": {
					en: "/about/[slug=int]",
					de: "/ueber-uns/[slug=int]",
				},
			},
			["en", "de"],
			{}
		)
		expect(result.length).toBe(1)
	})

	it("doesn't complain if all matchers are present, or if extra matchers are present", () => {
		const result = validatePathTranslations(
			{
				"/about/[slug=int]": {
					en: "/about/[slug=int]",
					de: "/ueber-uns/[slug=int]",
				},
			},
			["en", "de"],
			{
				int: () => true,
				float: () => true,
			}
		)
		expect(result.length).toBe(0)
	})
})
