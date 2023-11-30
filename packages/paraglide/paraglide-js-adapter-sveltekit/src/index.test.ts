import { describe, it, expect } from "vitest"
import { preprocess } from "./index.js"

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

	it("should  wrap quoted hrefs with variables", () => {
		const input = '<a href="https://inlang.dev/{variable}">inlang</a>'
		const output =
			"<a href={translatePath(`https://inlang.dev/${variable}`, languageTag())}>inlang</a>"

		const result = preprocessor.markup({ content: input })
		expect(result.code).toEqual(output)
	})
	it("should wrap hrefs with mustache tags", () => {
		const input = '<a href={"test" + 23 + "me"}>inlang</a>'
		const output = '<a href={translatePath(`${"test" + 23 + "me"}`, languageTag())}>inlang</a>'

		const result = preprocessor.markup({ content: input })
		expect(result.code).toEqual(output)
	})

	it("should respect existing hreflangs", () => {
		const input = '<a hreflang="en" href="/about">about</a>'
		const output = '<a hreflang="en" href={translatePath(`/about`, `en`)}>about</a>'

		const result = preprocessor.markup({ content: input })
		expect(result.code).toEqual(output)
	})
})
