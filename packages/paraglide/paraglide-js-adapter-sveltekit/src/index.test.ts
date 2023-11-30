import { describe, it, expect } from "vitest"
import { preprocess } from "./index"

const preprocessor = preprocess()

describe("preprocess", () => {
	it("should wrap quoted text-only hrefs", () => {
		const input = `<a href="https://inlang.dev">inlang</a>`
		const output = "<a href={translatePath(`https://inlang.dev`, languageTag())}>inlang</a>"

		const result = preprocessor.markup({ content: input })
		expect(result.code).toEqual(output)
	})

	it("should wrap unqouted text-only hrefs", () => {
		const input = "<a href=https://inlang.dev>inlang</a>"
		const output = "<a href={translatePath(`https://inlang.dev`, languageTag())}>inlang</a>"

		const result = preprocessor.markup({ content: input })
		expect(result.code).toEqual(output)
	})

	it("should escape text-only hrefs", () => {
		const input = "<a href=https://inlang.dev>inlang</a>"
		const output = "<a href={translatePath(`https://inlang.dev`, languageTag())}>inlang</a>"

		const result = preprocessor.markup({ content: input })
		expect(result.code).toEqual(output)
	})

	it("should escape multiple hrefs", () => {
		const input =
			"<h1><a href=https://inlang.dev>inlang</a><a href=https://inlang.dev>inlang</a><a href=https://inlang.dev>inlang</a></h1>"
		const output =
			"<h1><a href={translatePath(`https://inlang.dev`, languageTag())}>inlang</a><a href={translatePath(`https://inlang.dev`, languageTag())}>inlang</a><a href={translatePath(`https://inlang.dev`, languageTag())}>inlang</a></h1>"

		const result = preprocessor.markup({ content: input })
		expect(result.code).toEqual(output)
	})
})
