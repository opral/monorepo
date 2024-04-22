import { describe, it, expect } from "vitest"
import { guessTextDir, guessTextDirMap } from "./text-dir"

describe("guessTextDir", () => {
	it("should guess the text direction in Node", () => {
		expect(guessTextDir("ar")).toBe("rtl")
		expect(guessTextDir("en")).toBe("ltr")
		expect(guessTextDir("de")).toBe("ltr")
		expect(guessTextDir("")).toBe("ltr")
	})
})

describe("guessTextDirMap", () => {
	it("should guess the text direction for each language", () => {
		expect(guessTextDirMap(["ar", "en", "de"])).toEqual({
			ar: "rtl",
			en: "ltr",
			de: "ltr",
		})
	})
})
