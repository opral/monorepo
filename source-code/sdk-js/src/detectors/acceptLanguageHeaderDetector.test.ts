import { describe, expect, test } from "vitest"
import { initAcceptLanguageHeaderDetector } from "./acceptLanguageHeaderDetector.js"

const createTestParams = (
	acceptLanguageHeaderValue: string | undefined,
	headerName = "accept-language",
) => {
	const headers = new Headers()
	if (acceptLanguageHeaderValue !== undefined) {
		headers.set(headerName, acceptLanguageHeaderValue)
	}
	return headers
}

describe("acceptLanguageHeaderDetector", () => {
	test("header is undefined", () => {
		const headers = createTestParams(undefined)
		const detector = initAcceptLanguageHeaderDetector({ headers })
		expect(detector()).toStrictEqual([])
	})
	test("header is empty", () => {
		const headers = createTestParams("")
		const detector = initAcceptLanguageHeaderDetector({ headers })
		expect(detector()).toStrictEqual([])
	})
	test("header is single value without weight", () => {
		const headers = createTestParams("de-CH")
		const detector = initAcceptLanguageHeaderDetector({ headers })
		expect(detector()).toStrictEqual(["de-CH"])
	})
	test("header is multiple values", () => {
		const headers = createTestParams("de, de-AT;q=0.9, en;q=0.8")
		const detector = initAcceptLanguageHeaderDetector({ headers })
		expect(detector()).toStrictEqual(["de", "de-AT", "en"])
	})
	test("header is multiple values with weight", () => {
		const headers = createTestParams("en-US,en;q=0.9")
		const detector = initAcceptLanguageHeaderDetector({ headers })
		expect(detector()).toStrictEqual(["en-US", "en"])
	})
	test("header is multiple values with *", () => {
		const headers = createTestParams("fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5")
		const detector = initAcceptLanguageHeaderDetector({ headers })
		expect(detector()).toStrictEqual(["fr-CH", "fr", "en", "de"])
	})
	test("header is * only", () => {
		const headers = createTestParams("*")
		const detector = initAcceptLanguageHeaderDetector({ headers })
		expect(detector()).toStrictEqual([])
	})
	test("header is multiple values with weight and uppercased header name", () => {
		const headers = createTestParams("en-US,en;q=0.9", "ACCEPT-LANGUAGE")
		const detector = initAcceptLanguageHeaderDetector({ headers })
		expect(detector()).toStrictEqual(["en-US", "en"])
	})
	test("header is multiple values with * and capitalized Header name", () => {
		const headers = createTestParams(
			"fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5",
			"Accept-Language",
		)
		const detector = initAcceptLanguageHeaderDetector({ headers })
		expect(detector()).toStrictEqual(["fr-CH", "fr", "en", "de"])
	})
})
