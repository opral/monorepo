import { describe, it, expect } from "vitest"
import { base } from "$app/paths"
import { createReroute } from "./reroute"

//@ts-ignore
import * as runtime from "$paraglide/runtime.js"

const reroute = createReroute<"en" | "de">({
	defaultLanguageTag: "en",
	prefixDefaultLanguage: "never",
	exclude: () => false,
	seo: {
		noAlternateLinks: false,
	},
	translations: {},
	matchers: {},
	runtime,
	textDirection: {
		de: "ltr",
		en: "ltr",
	},
})

describe("reroute", () => {
	it("keeps the trailing slash if present", () => {
		const url = new URL("https://example.com" + base + "/some-page/")
		const pathname = reroute({ url })
		expect(pathname).toBe(base + "/some-page/")
	})

	it("doesn't add a trailing slash", () => {
		const url = new URL("https://example.com" + base + "/some-page")
		const pathname = reroute({ url })
		expect(pathname).toBe(base + "/some-page")
	})

	it("keeps the trailing slash on the language", () => {
		const url = new URL("https://example.com" + base + "/de/")
		const pathname = reroute({ url })
		expect(pathname).toBe(base ? base + "/" : "/")
	})

	it("doesn't add a trailing slash to the language", () => {
		const url = new URL("https://example.com" + base + "/de")
		const pathname = reroute({ url })
		expect(pathname).toBe(base ? base : "/")
	})

	it("removes the languagePrefix", () => {
		const url = new URL("https://example.com" + base + "/de")
		const pathname = reroute({ url })
		expect(pathname).toBe(base ? base : "/")
	})
})
