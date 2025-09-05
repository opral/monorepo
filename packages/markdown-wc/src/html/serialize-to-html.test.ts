import { test, expect } from "vitest"
import { serializeToHtml } from "./serialize-to-html.js"

test("serializeToHtml maps node.data.* to HTML data-* attributes", async () => {
	const ast = {
		type: "root",
		children: [
			{
				type: "paragraph",
				data: { id: "P1", foo: "bar" },
				children: [{ type: "text", value: "Hello" }],
			},
		],
	}

	const html = await serializeToHtml(ast)
	expect(html).toContain('<p data-id="P1" data-foo="bar">')
	expect(html).toContain(">Hello</p>")
})

test("serializeToHtml with diffHints adds data-diff-mode=words to paragraphs", async () => {
	const ast = {
		type: "root",
		children: [
			{
				type: "paragraph",
				data: { id: "P1" },
				children: [{ type: "text", value: "Hello" }],
			},
		],
	}

	const html = await serializeToHtml(ast, { diffHints: true })
	expect(html).toContain('<p data-id="P1" data-diff-mode="words">')
})
