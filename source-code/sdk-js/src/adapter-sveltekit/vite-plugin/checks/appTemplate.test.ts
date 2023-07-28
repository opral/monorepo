import { dedent } from "ts-dedent"
import { describe, it, expect } from "vitest"
import { removeHtmlLangAttribute } from "./appTemplate.js"

describe("removeHtmlLangAttribute", () => {
	it("should return undefined if the lang attribute is not present", () => {
		const markup = removeHtmlLangAttribute(dedent`
			<html>
				<body></body>
			</html>
		`)

		expect(markup).toBeUndefined()
	})

	it("should only detect the lang atttribute on the html tag", () => {
		const markup = removeHtmlLangAttribute(dedent`
			<html>
				<body lang="en">
					<div lang="de">Hello</div>
				</body>
			</html>
		`)

		expect(markup).toBeUndefined()
	})

	it("should remove the language attribute", () => {
		const markup = removeHtmlLangAttribute(dedent`
			<html lang="de">
			</html>
		`)

		expect(markup).toMatchInlineSnapshot(`
			"<html>
			</html>"
		`)
	})

	it("should remove the language attribute if empty", () => {
		const markup = removeHtmlLangAttribute(dedent`
			<html lang="">
			</html>
		`)

		expect(markup).toMatchInlineSnapshot(`
			"<html>
			</html>"
		`)
	})

	it("should remove the language attribute with placeholders", () => {
		const markup = removeHtmlLangAttribute(dedent`
			<html lang="%lang%">
			</html>
		`)

		expect(markup).toMatchInlineSnapshot(`
			"<html>
			</html>"
		`)
	})

	it("should not remove other attributes", () => {
		const markup = removeHtmlLangAttribute(dedent`
			<html data-theme="dark" lang="de" style="color-scheme: normal">
			</html>
		`)

		expect(markup).toMatchInlineSnapshot(`
			"<html data-theme=\\"dark\\" style=\\"color-scheme: normal\\">
			</html>"
		`)
	})
})
