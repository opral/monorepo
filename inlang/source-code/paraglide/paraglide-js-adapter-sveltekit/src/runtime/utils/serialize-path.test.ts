import { describe, it, expect } from "vitest"
import { serializeRoute } from "./serialize-path"

describe("serializePath", () => {
	it("correctly serializes the path (with base path)", () => {
		const path = serializeRoute({
			path: "/foo/bar",
			base: "/base",
			dataSuffix: undefined,
			includeLanguage: false,
			trailingSlash: false,
		})

		expect(path).toBe("/base/foo/bar")
	})

	it("correctly serializes the path (without base path)", () => {
		const path = serializeRoute({
			path: "/foo/bar",
			base: "/",
			dataSuffix: undefined,
			includeLanguage: false,
			trailingSlash: false,
		})

		expect(path).toBe("/foo/bar")
	})

	it("correctly serializes the path (with data suffix)", () => {
		const path = serializeRoute({
			path: "/foo/bar",
			base: "/",
			dataSuffix: "__data.json",
			includeLanguage: false,
			trailingSlash: false,
		})

		expect(path).toBe("/foo/bar/__data.json")
	})

	it("correctly serializes the path (with data suffix and base)", () => {
		const path = serializeRoute({
			path: "/foo/bar",
			base: "/base",
			dataSuffix: "__data.json",
			includeLanguage: false,
			trailingSlash: false,
		})

		expect(path).toBe("/base/foo/bar/__data.json")
	})

	it("correctly omits the language if it's the default language", () => {
		const path = serializeRoute({
			path: "/foo/bar",
			base: "/base",
			dataSuffix: undefined,
			includeLanguage: true,
			lang: "en",
			defaultLanguageTag: "en",
			prefixDefaultLanguage: "never",
			trailingSlash: false,
		})

		expect(path).toBe("/base/foo/bar")
	})

	it("correctly includes the language if it's not the default language", () => {
		const path = serializeRoute({
			path: "/foo/bar",
			base: "/base",
			dataSuffix: undefined,
			includeLanguage: true,
			lang: "en",
			defaultLanguageTag: "fr",
			prefixDefaultLanguage: "never",
			trailingSlash: false,
		})

		expect(path).toBe("/base/en/foo/bar")
	})

	it("correctly includes the language if it's the default language and prefixDefaultLanguage is set to 'always'", () => {
		const path = serializeRoute({
			path: "/foo/bar",
			base: "/base",
			dataSuffix: undefined,
			includeLanguage: true,
			lang: "en",
			defaultLanguageTag: "en",
			prefixDefaultLanguage: "always",
			trailingSlash: false,
		})

		expect(path).toBe("/base/en/foo/bar")
	})

	it("correctly sets the trailing slash", () => {
		const path = serializeRoute({
			path: "/foo/bar",
			base: "/base",
			dataSuffix: undefined,
			includeLanguage: false,
			trailingSlash: true,
		})

		expect(path).toBe("/base/foo/bar/")
	})
})
