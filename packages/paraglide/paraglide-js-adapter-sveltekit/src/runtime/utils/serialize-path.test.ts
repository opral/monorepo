import { describe, it, expect } from "vitest"
import { serializePath } from "./serialize-path"

describe("serializePath", () => {
	it("correctly serializes the path (with base path)", () => {
		const path = serializePath({
			path: "/foo/bar",
			lang: "de",
			base: "/base",
			defaultLanguageTag: "en",
			isDataRequest: false,
		})

		expect(path).toBe("/base/de/foo/bar")
	})

	it("correctly serializes the path (without base path)", () => {
		const path = serializePath({
			path: "/foo/bar",
			lang: "de",
			base: "/",
			defaultLanguageTag: "en",
			isDataRequest: false,
		})

		expect(path).toBe("/de/foo/bar")
	})

	it("correctly serializes the path (with data suffix)", () => {
		const path = serializePath({
			path: "/foo/bar",
			lang: "de",
			base: "/",
			defaultLanguageTag: "en",
			isDataRequest: true,
		})

		expect(path).toBe("/de/foo/bar/__data.json")
	})

	it("correctly serializes the path (with data suffix and base)", () => {
		const path = serializePath({
			path: "/foo/bar",
			lang: "de",
			base: "/base",
			defaultLanguageTag: "en",
			isDataRequest: true,
		})

		expect(path).toBe("/base/de/foo/bar/__data.json")
	})
})
