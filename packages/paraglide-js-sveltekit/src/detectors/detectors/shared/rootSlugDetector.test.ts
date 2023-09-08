import { describe, expect, test } from "vitest"
import { initRootSlugDetector } from "./rootSlugDetector.js"

describe("rootSlugDetector", () => {
	test("return first slug if found", () => {
		const url = new URL("http://localhost:80/en")
		const detector = initRootSlugDetector(url)
		expect(detector()).toMatchObject(["en"])
	})

	test("return first slug if found even if it is no languageTag-code", () => {
		const url = new URL("http://localhost:80/blue")
		const detector = initRootSlugDetector(url)
		expect(detector()).toMatchObject(["blue"])
	})

	test("return first slug if found with strange symbols", () => {
		const slug = "§r$6)8z{"
		const url = new URL(`http://localhost:80/${slug}/test`)
		const detector = initRootSlugDetector(url)
		expect(detector()).toMatchObject([encodeURI(slug)])
	})

	test("return empty array if the url has no path", () => {
		const url = new URL("http://localhost:80/")
		const detector = initRootSlugDetector(url)
		expect(detector()).toMatchObject([])
	})

	test("return only the first slug", () => {
		const url = new URL("http://localhost:80/en-US/de/fr")
		const detector = initRootSlugDetector(url)
		expect(detector()).toMatchObject(["en-US"])
	})
})
