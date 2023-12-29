import { it, expect } from "vitest"
import { lookup } from "./lookup.js"

it("doesn't end in the default language tag if it was already included", () => {
	expect(lookup("en-US", ["en-US", "en"], "en-US")).toEqual("en-US")
	expect(lookup("en-GB", ["en-US", "en"], "en-US")).toEqual("en")
	expect(lookup("fr", ["en-US", "en"], "en-US")).toEqual("en-US")
})

it("returns the correct fallback for a language with no region", () => {
	expect(lookup("de", ["en", "de", "de-CH"], "en")).toEqual("de")
})

it("returns the correct fallbacks for a language tag with a region", () => {
	expect(lookup("de-CH-ZH", ["en", "fr", "de-CH", "de"], "en")).toEqual("de-CH")
	expect(lookup("de-CH-ZH", ["en", "fr", "de-CH-ZH", "de"], "en")).toEqual("de-CH-ZH")
	expect(lookup("de-CH-ZH", ["en", "fr", "de"], "en")).toEqual("de")
	expect(lookup("de-CH-ZH", ["en", "fr"], "en")).toEqual("en")
})

it("returns the correct fallbacks for a language tag with a region and variant", () => {
	expect(lookup("de-CH-x-private1-private2", ["en", "fr", "de-CH", "de"], "en")).toEqual("de-CH")
	expect(
		lookup("de-CH-x-private1-private2", ["en", "fr", "de-CH-x-private1-private2", "de"], "en")
	).toEqual("de-CH-x-private1-private2")
	expect(lookup("de-CH-x-private1-private2", ["en", "fr", "de"], "en")).toEqual("de")
	expect(lookup("de-CH-x-private1-private2", ["en", "fr"], "en")).toEqual("en")
})

it("returns the correct fallbacks for a language tag with a region and a script", () => {
	expect(lookup("zh-Hans-CN", ["en", "zh-Hans-CN", "zh-Hans", "zh"], "en")).toEqual("zh-Hans-CN")
	expect(lookup("zh-Hans-CN", ["en", "zh-Hans", "zh"], "en")).toEqual("zh-Hans")
	expect(lookup("zh-Hans-CN", ["en", "zh"], "en")).toEqual("zh")
	expect(lookup("zh-Hans-CN", ["en"], "en")).toEqual("en")
})

it("does not get confused by the x separator", () => {
	expect(
		lookup("zh-Hans-CN-x-private1-private2", ["en", "zh-Hans-CN", "zh-Hans", "zh"], "en")
	).toEqual("zh-Hans-CN")
	expect(lookup("zh-Hans-CN-x-private1-private2", ["en", "zh-Hans", "zh"], "en")).toEqual("zh-Hans")
	expect(lookup("zh-Hans-CN-x-private1-private2", ["en", "zh"], "en")).toEqual("zh")
	expect(lookup("zh-Hans-CN-x-private1-private2", ["en"], "en")).toEqual("en")
})