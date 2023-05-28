import { expect, it } from "vitest"
import {
	LanguagePriority,
	getPreferredLanguage,
	parseAcceptLanguageHeader,
} from "../helper/lang.js"

it("should return empty array for empty string input", () => {
	expect(parseAcceptLanguageHeader("")).toEqual([])
})

it("should return array of LanguagePriority objects for valid input", () => {
	const input = "en-US,en;q=0.9,fr;q=0.8"
	const expectedOutput: LanguagePriority[] = [
		{ language: "en-US", priority: 1 },
		{ language: "en", priority: 0.9 },
		{ language: "fr", priority: 0.8 },
	]
	expect(parseAcceptLanguageHeader(input)).toEqual(expectedOutput)
})

it("should default to en when language is not specified", () => {
	const input = ",fr;q=0.8"
	const expectedOutput: LanguagePriority[] = [
		{ language: "en", priority: 1 },
		{ language: "fr", priority: 0.8 },
	]
	expect(parseAcceptLanguageHeader(input)).toEqual(expectedOutput)
})

it("should default to priority 1 when q-value is not specified", () => {
	const input = "en-US,en,fr"
	const expectedOutput: LanguagePriority[] = [
		{ language: "en-US", priority: 1 },
		{ language: "en", priority: 1 },
		{ language: "fr", priority: 1 },
	]
	expect(parseAcceptLanguageHeader(input)).toEqual(expectedOutput)
})

it("should return undefined for empty input array", () => {
	expect(getPreferredLanguage([])).toBeUndefined()
})

it("getPreferredLanguage should return the language with the highest priority", () => {
	const input: LanguagePriority[] = [
		{ language: "en-US", priority: 0.8 },
		{ language: "en", priority: 1 },
		{ language: "fr", priority: 0.5 },
	]
	expect(getPreferredLanguage(input)).toEqual("en")
})

it("should return the first language with the highest priority when multiple languages have the same priority", () => {
	const input: LanguagePriority[] = [
		{ language: "en-US", priority: 0.8 },
		{ language: "en", priority: 0.9 },
		{ language: "fr", priority: 0.9 },
	]
	expect(getPreferredLanguage(input)).toEqual("en")
})

it("should return the only language in the array", () => {
	const input: LanguagePriority[] = [{ language: "en-US", priority: 1 }]
	expect(getPreferredLanguage(input)).toEqual("en-US")
})
