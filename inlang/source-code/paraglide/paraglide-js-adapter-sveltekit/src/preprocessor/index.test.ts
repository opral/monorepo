import { describe, it, expect } from "vitest"
import { preprocess } from "./index.js"
import { LANGUAGE_TAG_ALIAS } from "../constants.js"

const preprocessor = preprocess()

describe("preprocess", () => {
	it("should wrap quoted text-only hrefs", () => {
		const input = `<a href="https://inlang.com">inlang</a>`
		const output = `<a href={translatePath(\`https://inlang.com\`, ${LANGUAGE_TAG_ALIAS}())}>inlang</a>`

		const result = preprocessor.markup({ content: input })
		expect(result.code).toEqual(output)
	})

	it("should wrap unqouted text-only hrefs", () => {
		const input = "<a href=https://inlang.com>inlang</a>"
		const output = `<a href={translatePath(\`https://inlang.com\`, ${LANGUAGE_TAG_ALIAS}())}>inlang</a>`

		const result = preprocessor.markup({ content: input })
		expect(result.code).toEqual(output)
	})

	it("should escape multiple hrefs", () => {
		const input =
			"<h1><a href=https://inlang.com>inlang</a><a href=https://inlang.com>inlang</a><a href=https://inlang.com>inlang</a></h1>"
		const output = `<h1><a href={translatePath(\`https://inlang.com\`, ${LANGUAGE_TAG_ALIAS}())}>inlang</a><a href={translatePath(\`https://inlang.com\`, ${LANGUAGE_TAG_ALIAS}())}>inlang</a><a href={translatePath(\`https://inlang.com\`, ${LANGUAGE_TAG_ALIAS}())}>inlang</a></h1>`

		const result = preprocessor.markup({ content: input })
		expect(result.code).toEqual(output)
	})

	it("should  wrap quoted hrefs with variables", () => {
		const input = '<a href="https://inlang.com/{variable}">inlang</a>'
		const output = `<a href={translatePath(\`https://inlang.com/\${variable}\`, ${LANGUAGE_TAG_ALIAS}())}>inlang</a>`

		const result = preprocessor.markup({ content: input })
		expect(result.code).toEqual(output)
	})
	it("should wrap hrefs with mustache tags", () => {
		const input = '<a href={"test" + 23 + "me"}>inlang</a>'
		const output = '<a href={translatePath(`${"test" + 23 + "me"}`, languageTag())}>inlang</a>'

		const result = preprocessor.markup({ content: input })
		expect(result.code).toEqual(output)
	})

	it("should respect static hreflangs", () => {
		const input = '<a hreflang="en" href="/about">about</a>'
		const output = '<a hreflang="en" href={translatePath(`/about`, `en`)}>about</a>'

		const result = preprocessor.markup({ content: input })
		expect(result.code).toEqual(output)
	})

	it("should respect dynamic hreflangs", () => {
		const input = '<a hreflang={lang} href="/about">about</a>'
		const output = "<a hreflang={lang} href={translatePath(`/about`, `${lang}`)}>about</a>"

		const result = preprocessor.markup({ content: input })
		expect(result.code).toEqual(output)
	})

	it("escapes backticks in hrefs", () => {
		const input = '<a href="/abou`t">About</a>'
		const output = "<a href={translatePath(`/abou\\`t`, languageTag())}>About</a>"

		const result = preprocessor.markup({ content: input })
		expect(result.code).toEqual(output)
	})
})
